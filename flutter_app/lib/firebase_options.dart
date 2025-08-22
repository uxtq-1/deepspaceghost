import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

// Placeholder Firebase configuration.
// Replace these values using `flutterfire configure`.
// Avoid committing real credentials to version control.

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return const FirebaseOptions(
        apiKey: 'YOUR_WEB_API_KEY',
        authDomain: 'YOUR_PROJECT.firebaseapp.com',
        projectId: 'YOUR_PROJECT',
        storageBucket: 'YOUR_PROJECT.appspot.com',
        messagingSenderId: 'SENDER_ID',
        appId: 'APP_ID',
      );
    }
    throw UnsupportedError('DefaultFirebaseOptions are not set for this platform.');
  }
}
