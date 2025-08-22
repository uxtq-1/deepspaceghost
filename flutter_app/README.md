# DeepSpaceGhost Flutter App

This directory contains a Flutter implementation of the DeepSpaceGhost chatbot, leveraging Firebase for backend services.

## Getting Started

1. Ensure [Flutter](https://flutter.dev/docs/get-started/install) and [FlutterFire CLI](https://firebase.flutter.dev/docs/cli) are installed.
2. Configure Firebase for your project:
   ```bash
   flutterfire configure
   ```
3. Run the app:
   ```bash
   flutter run
   ```

## Security

- Input is sanitized to mitigate injection attacks and enforce message length limits.
- Replace the placeholder Firebase configuration in `lib/firebase_options.dart` using `flutterfire configure` and keep real credentials out of source control.
- Configure Firebase Authentication and Firestore/Realtime Database security rules following NIST CSF, CISA, and PCI DSS guidance.
