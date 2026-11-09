import 'package:flutter/material.dart';
import '../core/session_manager.dart';
import '../features/customer/customer_home_screen.dart';
import '../features/customer/customer_bookings_screen.dart';
import '../features/ai_assistant/ai_assistant_screen.dart';
import '../features/communication/notifications_screen.dart';
import '../features/professional/pro_dashboard_screen.dart';
import '../features/business/business_dashboard_screen.dart';
import '../features/business/properties_screen.dart';
import '../features/business/equipment_screen.dart';
import '../features/business/maintenance_screen.dart';
import '../features/profile/profile_screen.dart';
import '../theme/easylife_theme.dart';

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;
  late final SessionManager _sessionManager;

  @override
  void initState() {
    super.initState();
    _sessionManager = SessionManager();
    _sessionManager.addListener(_onSessionChanged);
  }

  void _onSessionChanged() {
    if (mounted) {
      setState(() {
        _currentIndex = 0; // Reset tab index when role switches
      });
    }
  }

  @override
  void dispose() {
    _sessionManager.removeListener(_onSessionChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeRole = _sessionManager.activeRole;

    List<Widget> screens;
    List<BottomNavigationBarItem> navItems;

    switch (activeRole) {
      case AppRole.professional:
        screens = const [
          ProDashboardScreen(),
          CustomerBookingsScreen(),
          NotificationsScreen(),
          ProfileScreen(),
        ];
        navItems = const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.work_outline),
            activeIcon: Icon(Icons.work),
            label: 'Jobs & Quotes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications_outlined),
            activeIcon: Icon(Icons.notifications),
            label: 'Alerts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Pro Profile',
          ),
        ];
        break;

      case AppRole.business:
        screens = const [
          BusinessDashboardScreen(),
          PropertiesScreen(properties: []),
          EquipmentScreen(assets: []),
          MaintenanceScreen(),
          ProfileScreen(),
        ];
        navItems = const [
          BottomNavigationBarItem(
            icon: Icon(Icons.business_outlined),
            activeIcon: Icon(Icons.business),
            label: 'Overview',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.apartment_outlined),
            activeIcon: Icon(Icons.apartment),
            label: 'Properties',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.precision_manufacturing_outlined),
            activeIcon: Icon(Icons.precision_manufacturing),
            label: 'Assets',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.build_circle_outlined),
            activeIcon: Icon(Icons.build_circle),
            label: 'Maintenance',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Account',
          ),
        ];
        break;

      case AppRole.customer:
      default:
        screens = const [
          CustomerHomeScreen(),
          CustomerBookingsScreen(),
          AiAssistantScreen(),
          NotificationsScreen(),
          ProfileScreen(),
        ];
        navItems = const [
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            activeIcon: Icon(Icons.search, size: 26),
            label: 'Explore',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today_outlined),
            activeIcon: Icon(Icons.calendar_today),
            label: 'Bookings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.auto_awesome_outlined),
            activeIcon: Icon(Icons.auto_awesome),
            label: 'AI Assistant',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications_outlined),
            activeIcon: Icon(Icons.notifications),
            label: 'Alerts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ];
        break;
    }

    final safeIndex = _currentIndex < screens.length ? _currentIndex : 0;

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: safeIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: EasyLifeColors.surfaceWhite,
        selectedItemColor: EasyLifeColors.teal600,
        unselectedItemColor: EasyLifeColors.charcoal500,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
        items: navItems,
      ),
    );
  }
}
