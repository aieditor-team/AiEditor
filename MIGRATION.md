# Migrating from AiEditor 1.x to 2.0

AiEditor 2 is a major rewrite based on Tiptap 3. Treat the upgrade as an application migration rather than a drop-in dependency update.

## Package imports

Import runtime APIs only from the package root and styles from the public CSS entry:

```ts
import {AiEditor} from 'aieditor'
import 'aieditor/style.css'
```

Imports from `aieditor/src/*` or other internal paths are unsupported.

AiEditor 2 publishes ESM and CommonJS entry points. The 1.x UMD bundle and the browser-global `AiEditor`
constructor are no longer published. Browser applications should use a bundler that can consume npm packages.

## Configuration mapping

The following table covers common 1.x options. It is a migration guide, not an automatic compatibility layer.

| AiEditor 1.x | AiEditor 2.0 | Notes |
| --- | --- | --- |
| `lang` | `locale` | Built-in locale identifiers are now `zh-CN` and `en-US`. |
| `i18n` | `translations` | Values are partial dictionaries and fall back to English. |
| `toolbarKeys` / `toolbarExcludeKeys` | `toolbar.menus` | Use an explicit array or transform the default menu array. |
| `toolbarSize: 'medium'` | `toolbar.size: 'default'` | `small` and `large` keep their names. |
| `textSelectionBubbleMenu` | `bubbleMenu` | Set it to `false` to disable the text and link bubble menus. |
| `onCreated` | `onMount` | Lifecycle callbacks now receive the Tiptap `Editor`, not the `AiEditor` facade. |
| `onChange` | `onUpdate` | The callback receives both the Tiptap `Editor` and transaction. |
| `onCreateBefore` | `extensions` / `extensionManager` | Register or replace extensions explicitly. |
| media-specific upload URLs | `uploader.upload` | One cancellable upload contract serves images, audio, video, and attachments. |
| `contentIsMarkdown` | host-side conversion | Convert Markdown to HTML or Tiptap JSON before assigning `content`. |
| `contentRetention*` | host-side persistence | Persist `getJSON()` from `onUpdate` and restore it through `content`. |

For example, replace a string-based toolbar configuration with the typed menu configuration:

```ts
const editor = new AiEditor({
  element: '#editor',
  locale: 'zh-CN',
  toolbar: {
    size: 'default',
    menus: (defaults) => defaults.filter((item) => item.id !== 'strike'),
  },
  onUpdate(tiptapEditor) {
    localStorage.setItem('document', JSON.stringify(tiptapEditor.getJSON()))
  },
})
```

## Editor configuration

The legacy `AiModelManager`, model-specific classes, callback URL generation, and component internals are no
longer part of the public API. AiEditor 2 exposes provider registration, `AiService`, and editor tools instead.

An OpenAI-compatible 1.x model configuration:

```ts
ai: {
  models: {
    openai: {endpoint: 'https://example.com/v1', apiKey: '...', model: 'model-name'},
  },
}
```

becomes a selected provider in 2.0:

```ts
ai: {
  provider: 'openai',
  baseURL: 'https://example.com/v1',
  apiKey: '...',
  model: 'model-name',
  dangerouslyAllowBrowser: true,
}
```

Do not ship provider secrets in browser bundles. Prefer a server-side proxy in production. Services that do not
implement an OpenAI-compatible API should use `{provider: 'custom', generate(request, context) { ... }}`. The
old `wrapPayload`, `parseMessage`, and SSE/WebSocket client hooks do not have direct 2.0 equivalents.

Review each `AiEditor` option against the current types. In particular, migrate custom extensions, menus, upload handlers, AI providers, and locale configuration explicitly.

## Tiptap integration

AiEditor 2 uses Tiptap 3. Custom Tiptap 2 extensions must be upgraded before being passed through `AiEditorOptions.extensions` or a product extension factory.

Persisted Tiptap JSON should be tested against the AiEditor 2 runtime schema. By default, unknown nodes, marks,
and attributes are sanitized and reported during import. Before upgrading production data:

1. Keep an immutable backup of the original HTML or JSON.
2. Load representative documents with every application and product extension registered.
3. Inspect content-sanitization warnings and compare `getJSON()` or `getHTML()` with the source.
4. Save the migrated document only after application-level validation succeeds.

Set `contentSanitization: {warn: false}` only after the warnings have been understood. Setting
`contentSanitization: false` disables AiEditor sanitization and should not be used as a blanket migration fix.

## Product packages

Pagination belongs to `@aieditor/pro`. Official-document and medical behavior must be supplied by their respective product packages through the public product injection APIs.

Upgrade `aieditor`, `@aieditor/pro`, and any product package together so their peer dependency ranges remain compatible.

## Verification

Run the application test suite with real custom extensions and a copy of representative persisted data. Also verify
toolbar customization, uploads, locale switching, read-only mode, AI cancellation, and any direct access to the
underlying Tiptap editor. TypeScript compilation alone cannot prove schema or document compatibility.
