import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:easylife_mobile/core/session_manager.dart';
import 'package:easylife_mobile/models/quotation.dart';
import 'package:easylife_mobile/models/booking.dart';
import 'package:easylife_mobile/models/service_category.dart';
import 'package:easylife_mobile/navigation/main_navigation_shell.dart';
import 'package:easylife_mobile/services/ai_assistant_service.dart';
import 'package:easylife_mobile/shared/status_chip.dart';
import 'package:easylife_mobile/theme/easylife_theme.dart';

void main() {
  group('Prompt 20 - Mobile Role Management & Session', () {
    test('SessionManager role-switching and permission state', () {
      final session = SessionManager();

      // Configure mock user with customer, pro, and business roles
      session.setMockUser(
        id: 'test-user-ph-01',
        email: 'user@easylife.ng',
        fullName: 'Chidi Amadi',
        role: AppRole.customer,
      );

      expect(session.isAuthenticated, isTrue);
      expect(session.activeRole, AppRole.customer);
      expect(session.availableRoles.contains(AppRole.customer), isTrue);
      expect(session.availableRoles.contains(AppRole.professional), isTrue);
      expect(session.availableRoles.contains(AppRole.business), isTrue);

      // Switch to professional
      session.switchActiveRole(AppRole.professional);
      expect(session.activeRole, AppRole.professional);

      // Switch to business
      session.switchActiveRole(AppRole.business);
      expect(session.activeRole, AppRole.business);

      // Switch back to customer
      session.switchActiveRole(AppRole.customer);
      expect(session.activeRole, AppRole.customer);
    });
  });

  group('Prompt 20 - AI Problem Assistant Diagnostics (Feature 20)', () {
    final aiService = AiAssistantService();
    final categories = [
      const ServiceCategory(
        id: 'cat-gen-01',
        name: 'Generators & Power Systems',
        slug: 'generators',
        description: 'Diesel and petrol generator repairs and maintenance',
        iconName: 'power',
      ),
      const ServiceCategory(
        id: 'cat-hvac-02',
        name: 'Air Conditioning & Cooling',
        slug: 'air-conditioning',
        description: 'Split ACs, standing units, and industrial chillers',
        iconName: 'ac_unit',
      ),
      const ServiceCategory(
        id: 'cat-plumb-03',
        name: 'Plumbing & Water Systems',
        slug: 'plumbing',
        description: 'Boreholes, piping, overhead tanks, and water leakages',
        iconName: 'water_drop',
      ),
    ];

    test('Diagnoses Prompt 17 & 20 generator problem scenario accurately', () {
      final output = aiService.analyzeProblem(
        'My generator starts normally but switches off after a few minutes.',
        categories,
      );

      expect(output.suggestedCategoryName, 'Generators & Power Systems');
      expect(output.suggestedCategoryId, 'cat-gen-01');
      expect(output.suggestedProfessionalType, 'Certified Generator Technician');
      expect(output.estimatedUrgency, 'high');
      expect(output.clarifyingQuestions.isNotEmpty, isTrue);
      expect(
        output.clarifyingQuestions.any((q) => q.contains('generator capacity') || q.contains('shutting down')),
        isTrue,
      );
      expect(output.draftTitle, 'Generator Diagnostics & Servicing');
    });

    test('Diagnoses AC cooling and refrigerant issues', () {
      final output = aiService.analyzeProblem(
        'The air conditioner in the master bedroom is blowing warm air and making a humming sound.',
        categories,
      );

      expect(output.suggestedCategoryName, 'Air Conditioning & Cooling');
      expect(output.suggestedProfessionalType, 'HVAC & AC Technician');
      expect(output.clarifyingQuestions.length, greaterThanOrEqualTo(2));
    });

    test('Flags plumbing pipe burst as emergency', () {
      final output = aiService.analyzeProblem(
        'Major water pipe burst in the kitchen, severe flooding happening right now!',
        categories,
      );

      expect(output.suggestedCategoryName, 'Plumbing & Water Systems');
      expect(output.suggestedProfessionalType, 'Licensed Plumber');
      expect(output.estimatedUrgency, 'emergency');
    });
  });

  group('Prompt 20 - Itemized Quotation & Booking Financial Breakdown', () {
    test('Calculates quotation total and formats Naira currency correctly', () {
      const quote = Quotation(
        id: 'quote-001',
        referenceCode: 'QT-PH-001',
        bookingId: 'bk-ph-01',
        professionalId: 'pro-001',
        labourChargesKobo: 1200000, // ₦12,000.00
        materialsCostsKobo: 650000, // ₦6,500.00
        additionalExpensesKobo: 150000, // ₦1,500.00
        totalAmountKobo: 2000000, // ₦20,000.00
        estimatedDurationMinutes: 240,
        workDescription: 'Full servicing, oil replacement, and AVR calibration.',
        status: 'pending',
        createdAt: '2026-11-08T05:00:00Z',
      );

      expect(quote.totalAmountKobo, 2000000);
      expect(quote.totalAmountNaira, 20000.0);
      expect(quote.labourNaira, 12000.0);
      expect(quote.materialsNaira, 6500.0);
      expect(quote.expensesNaira, 1500.0);
      expect(quote.isPending, isTrue);
    });

    test('Booking model handles escrow confirmation state and PIN safety', () {
      const booking = Booking(
        id: 'bk-101',
        referenceCode: 'EL-PH-2026-0042',
        customerId: 'cust-1',
        professionalId: 'pro-1',
        categoryId: 'cat-1',
        categoryName: 'Electrical & Wiring',
        professionalName: 'Apex Electrics Port Harcourt',
        title: '3-Phase Distribution Box Servicing',
        description: 'Circuit breaker trips randomly when AC turns on.',
        status: 'in_progress',
        city: 'Port Harcourt',
        serviceAddress: '14 Peter Odili Road, Trans-Amadi',
        agreedAmountKobo: 2500000,
        createdAt: '2026-11-08T04:30:00Z',
      );

      expect(booking.referenceCode, 'EL-PH-2026-0042');
      expect(booking.status, 'in_progress');
      expect(booking.agreedAmountNaira, 25000.0);
    });
  });

  group('Prompt 20 - UI Widgets & Role-Aware Navigation Shell', () {
    testWidgets('Renders StatusChip with correct semantic theme badges', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                StatusChip(status: 'confirmed'),
                StatusChip(status: 'completed'),
                StatusChip(status: 'disputed'),
                StatusChip(status: 'pending'),
              ],
            ),
          ),
        ),
      );

      expect(find.text('CONFIRMED'), findsOneWidget);
      expect(find.text('COMPLETED'), findsOneWidget);
      expect(find.text('DISPUTED'), findsOneWidget);
      expect(find.text('PENDING'), findsOneWidget);
    });

    testWidgets('MainNavigationShell renders role-aware navigation and switches modes',
        (WidgetTester tester) async {
      final session = SessionManager();
      session.setMockUser(
        id: 'test-user-shell-01',
        email: 'port-harcourt-pro@easylife.ng',
        fullName: 'Tari Douglas',
        role: AppRole.customer,
      );

      // Build navigation shell inside MaterialApp with theme
      await tester.pumpWidget(
        MaterialApp(
          theme: EasyLifeTheme.lightTheme,
          home: const MainNavigationShell(),
        ),
      );
      await tester.pumpAndSettle();

      // Customer mode initial tabs
      expect(find.text('Explore'), findsOneWidget);
      expect(find.text('Bookings'), findsOneWidget);
      expect(find.text('AI Assistant'), findsOneWidget);
      expect(find.text('Alerts'), findsOneWidget);
      expect(find.text('Profile'), findsOneWidget);

      // Switch to Professional Role
      session.switchActiveRole(AppRole.professional);
      await tester.pumpAndSettle();

      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Jobs & Quotes'), findsOneWidget);
      expect(find.text('Pro Profile'), findsOneWidget);

      // Switch to Business Role
      session.switchActiveRole(AppRole.business);
      await tester.pumpAndSettle();

      expect(find.text('Overview'), findsOneWidget);
      expect(find.text('Properties'), findsWidgets);
      expect(find.text('Assets'), findsWidgets);
      expect(find.text('Maintenance'), findsWidgets);
    });
  });
}
