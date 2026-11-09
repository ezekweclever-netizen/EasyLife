# EasyLife Mobile (`apps/mobile`)

Flutter application targeting **Android** and **iOS** connected to the central EasyLife Supabase backend.

## Architecture Note
`apps/mobile` is intentionally kept independent of the root Node.js `workspaces` array so Flutter/Dart tooling (`pub`, Gradle, CocoaPods) operates cleanly without `node_modules` interference.

## Running Locally
Once the Flutter SDK is in your `PATH`:

```powershell
cd apps/mobile
flutter create . --project-name easylife_mobile --platforms android,ios
flutter pub get
flutter analyze
flutter run --dart-define=SUPABASE_URL=<your-supabase-url> --dart-define=SUPABASE_ANON_KEY=<your-supabase-anon-key>
```
