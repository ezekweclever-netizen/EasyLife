import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'core/session_manager.dart';
import 'navigation/main_navigation_shell.dart';
import 'theme/easylife_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Supabase.initialize(
      url: SupabaseConfig.url,
      publishableKey: SupabaseConfig.publishableKey,
    );
  } catch (e) {
    debugPrint('[Main] Supabase initialize note: $e');
  }

  await SessionManager().initialize();

  runApp(const EasyLifeMobileApp());
}

class EasyLifeMobileApp extends StatelessWidget {
  const EasyLifeMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EasyLife',
      debugShowCheckedModeBanner: false,
      theme: EasyLifeTheme.lightTheme,
      home: const MainNavigationShell(),
    );
  }
}
