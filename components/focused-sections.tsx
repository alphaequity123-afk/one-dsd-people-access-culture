"use client";
import { Children, Fragment, isValidElement, useEffect, useId, useState, type ReactNode, type ReactElement } from "react";

type ElementProps = { children?: ReactNode; id?: string; "aria-labelledby"?: string; className?: string; "data-topic-title"?: string };
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(child => isValidElement<ElementProps>(child) && child.type === Fragment ? flatten(child.props.children) : [child]);
}
function words(children: ReactNode): string {
  return Children.toArray(children).map(child => typeof child === "string" || typeof child === "number" ? String(child) : isValidElement<ElementProps>(child) ? words(child.props.children) : "").join(" ").replace(/\s+/g, " ").trim();
}
function heading(children: ReactNode): string {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<ElementProps>(child)) continue;
    if (child.type === "h2" || (typeof child.type === "function" && child.type.name === "H2")) return words(child.props.children);
    const nested = heading(child.props.children);
    if (nested) return nested;
  }
  return "";
}

/** A page introduction remains available when a deep link opens a later topic. */
function containsPageHeading(children: ReactNode): boolean {
  return Children.toArray(children).some(child => isValidElement<ElementProps>(child)
    && (child.type === "h1" || containsPageHeading(child.props.children)));
}

/** Existing sections stay mounted, so notes, media and activity choices survive topic changes. */
export function FocusedSections({ children, label = "Explore this page" }: { children: ReactNode; label?: string }) {
  const nodes = flatten(children);
  const sections = nodes.filter((node): node is ReactElement<ElementProps> => isValidElement<ElementProps>(node) && node.type === "section" && !containsPageHeading(node.props.children));
  const uid = useId().replace(/:/g, "");
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const ids = sections.map((s,i) => s.props.id || s.props["aria-labelledby"] || `topic-${i + 1}`);
  const labels = sections.map((s,i) => s.props["data-topic-title"] || heading(s.props.children) || `Part ${i + 1}`);
  useEffect(() => {
    const sync = () => {
      const query = new URLSearchParams(window.location.search).get("section");
      let fragment = "";
      try { fragment = decodeURIComponent(window.location.hash.slice(1)); } catch { /* Malformed fragments do not change the current topic. */ }
      const direct = ids.indexOf(fragment || query || "");
      const descendant = fragment ? sections.findIndex((_,i) => {
        const panel = document.getElementById(`${uid}-panel-${i}`);
        const target = document.getElementById(fragment);
        return !!target && !!panel?.contains(target);
      }) : -1;
      const found = descendant >= 0 ? descendant : direct;
      setSelected(found >= 0 ? found : 0);
      setReady(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
    // The sections are server-rendered children. Their ids are stable until navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, ids.join("|")]);
  if (sections.length < 3) return <>{children}</>;
  const choose = (index: number) => {
    document.getElementById(`${uid}-panel-${selected}`)?.querySelectorAll<HTMLMediaElement>("audio,video").forEach(media => media.pause());
    setSelected(index);
    const url = new URL(window.location.href);
    url.searchParams.set("section", ids[index]);
    url.hash = "";
    window.history.pushState(null, "", url);
    requestAnimationFrame(() => {
      const panel = document.getElementById(`${uid}-panel-${index}`);
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView?.({ block: "start", behavior: "instant" });
    });
  };
  return <div className="focused-sections" data-ready={ready}>
    {nodes.map((node,index) => {
      if (!isValidElement<ElementProps>(node) || node.type !== "section" || containsPageHeading(node.props.children)) return <Fragment key={index}>{node}</Fragment>;
      const current = sections.indexOf(node);
      const first = current === 0;
      return <Fragment key={index}>{first ? <details className="pilot-supporting focused-contents"><summary>{label}</summary><nav className="pilot-supporting-body" aria-label={label}><ol>{labels.map((title,i)=><li key={ids[i]}><button type="button" aria-current={selected===i?"page":undefined} onClick={()=>choose(i)}>{title}</button></li>)}</ol></nav></details> : null}
        <div id={`${uid}-panel-${current}`} className="focused-section-panel" hidden={ready && selected !== current} tabIndex={-1}>{node}</div>
        {current === sections.length - 1 ? <nav className="source-reading-pagination" aria-label="Page topics"><button type="button" disabled={selected===0} onClick={()=>choose(selected-1)}>Previous</button><span>{selected+1} of {sections.length}</span><button type="button" disabled={selected===sections.length-1} onClick={()=>choose(selected+1)}>Next</button></nav> : null}
      </Fragment>;
    })}
  </div>;
}
