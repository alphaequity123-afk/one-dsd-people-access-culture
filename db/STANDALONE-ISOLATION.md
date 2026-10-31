# Standalone One DSD database isolation

Runtime source targets private pac_dsd and pac_dsd_auth schemas with separately restricted roles, authentication cookie/signature context and secrets. Existing db/migrations files are preserved historical source, not a standalone executable migration sequence. Legacy shared-schema migration/provision/import/publication writers refuse execution in this standalone codebase.

The credential-free reviewed bootstrap, transform manifest and instructions are included in db/standalone/. The transform changes exact schema/role identifiers, preserves canonical content IDs, replaces global digest compatibility helpers with private wrappers, and uses the existing corrective resource receipt migration rather than obsolete 0061. Never replay original shared-schema migrations or copy One DHS private work rows. Public learning/resources remain static source-authoritative. Credentials are stored privately outside source and are excluded from release archives.
