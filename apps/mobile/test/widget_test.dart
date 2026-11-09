import 'package:flutter_test/flutter_test.dart';
import 'package:easylife_mobile/main.dart';

void main() {
  testWidgets('EasyLife welcome smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const EasyLifeMobileApp());
    expect(find.text('EasyLife'), findsOneWidget);
    expect(find.text('Explore'), findsOneWidget);
  });
}
