import '../models/ai_assistant_model.dart';
import '../models/service_category.dart';

class AiAssistantService {
  /// Analyzes a customer's plain-text problem description
  /// Produces structured analysis, clarifying questions, and scaffolded draft request
  AiStructuredOutput analyzeProblem(String text, List<ServiceCategory> categories) {
    final lower = text.toLowerCase();

    String catName = 'General Maintenance';
    const String catId = '10000000-0000-4000-8000-000000000001';
    String proType = 'General Facility Technician';
    String urgency = 'normal';
    List<String> questions = [];
    String title = 'Facility Maintenance Request';

    if (lower.contains('generator') || lower.contains('gen') || lower.contains('avr') || lower.contains('oil leak')) {
      catName = 'Generator Maintenance';
      proType = 'Certified Generator Technician';
      title = 'Generator Diagnostics & Servicing';
      if (lower.contains('switches off') || lower.contains('cuts off') || lower.contains('shuts down') || lower.contains('smokes')) {
        urgency = 'high';
        questions = [
          'Does the engine sound rough or rattle before shutting down?',
          'What is the generator capacity (e.g., 2.5kVA, 5kVA, 15kVA, 50kVA+)?',
          'When was the engine oil or fuel filter last serviced?',
        ];
      } else {
        questions = [
          'Is it a petrol (gasoline) or diesel engine?',
          'Does it fail to crank or crank without catching fire?',
        ];
      }
    } else if (lower.contains('ac') || lower.contains('air condition') || lower.contains('chiller') || lower.contains('cool') || lower.contains('gas')) {
      catName = 'HVAC & Air Conditioning';
      proType = 'HVAC & AC Technician';
      title = 'AC Repair & Cooling Diagnostics';
      urgency = lower.contains('water leak') || lower.contains('spark') ? 'high' : 'normal';
      questions = [
        'Is the indoor fan blowing warm room-temperature air or is the outdoor unit silent?',
        'Are there any water drips, ice accumulation, or foul odors from the vents?',
        'Is it a split unit, standing package, or central ducted system?',
      ];
    } else if (lower.contains('leak') || lower.contains('pipe') || lower.contains('tap') || lower.contains('water') || lower.contains('pump') || lower.contains('borehole') || lower.contains('drain')) {
      catName = 'Plumbing & Water Systems';
      proType = 'Licensed Plumber';
      title = 'Plumbing Leakage & Pipe Repair';
      urgency = lower.contains('burst') || lower.contains('flooding') ? 'emergency' : 'high';
      questions = [
        'Is water actively overflowing, pooling, or damaging floors/walls?',
        'Have you been able to isolate the main stopcock valve?',
        'Is the fault linked to a submersible borehole pump, overhead tank, or interior fixture?',
      ];
    } else if (lower.contains('light') || lower.contains('wire') || lower.contains('shock') || lower.contains('spark') || lower.contains('breaker') || lower.contains('power') || lower.contains('tripping')) {
      catName = 'Electrical & Wiring';
      proType = 'Certified Master Electrician';
      title = 'Electrical Fault Finding & Rewiring';
      urgency = lower.contains('shock') || lower.contains('spark') || lower.contains('burn') ? 'emergency' : 'high';
      questions = [
        'Is there any burning smell, visible scorch marks, or tingling sensation on appliances?',
        'Does the breaker trip immediately upon being reset or only when specific appliances turn on?',
        'Is this affecting single sockets or your entire distribution board?',
      ];
    } else if (lower.contains('inverter') || lower.contains('solar') || lower.contains('battery')) {
      catName = 'Solar & Inverter Systems';
      proType = 'Solar & Inverter Energy Specialist';
      title = 'Inverter System Diagnostic & Battery Check';
      urgency = 'high';
      questions = [
        'What error code or beep pattern is displaying on the inverter screen?',
        'Are the batteries tubular, gel, or lithium-ion?',
        'Does the system trip immediately upon NEPA / grid failure or fail to charge?',
      ];
    } else if (lower.contains('door') || lower.contains('cabinet') || lower.contains('lock') || lower.contains('wood') || lower.contains('furniture')) {
      catName = 'Carpentry & Furniture';
      proType = 'Professional Carpenter';
      title = 'Carpentry & Woodwork Repair';
      questions = [
        'Is the issue with door alignment, swollen wood from moisture, or damaged hinges?',
        'Are replacement hardware pieces already purchased or required from the artisan?',
      ];
    } else if (lower.contains('paint') || lower.contains('crack') || lower.contains('damp') || lower.contains('screed')) {
      catName = 'Painting & Wall Finishes';
      proType = 'Commercial & Residential Painter';
      title = 'Wall Preparation & Painting';
      questions = [
        'Is there underlying dampness or peeling plaster that requires water-proofing screed?',
        'What is the approximate size or number of rooms requiring coverage?',
      ];
    } else if (lower.contains('termite') || lower.contains('fumigat') || lower.contains('pest') || lower.contains('clean')) {
      catName = 'Cleaning & Pest Control';
      proType = 'Pest Management & Janitorial Specialist';
      title = 'Fumigation & Deep Cleaning Service';
      questions = [
        'What pests have been observed (e.g. termites, rodents, cockroaches, bedbugs)?',
        'Can the premises be evacuated for 4 to 8 hours post-treatment?',
      ];
    }

    // Match real category ID from database categories list if available
    final matched = categories.firstWhere(
      (c) {
        final cLower = c.name.toLowerCase();
        final catLower = catName.toLowerCase();
        return cLower.contains(catLower) ||
            catLower.contains(cLower) ||
            (catLower.contains('generator') && cLower.contains('generator')) ||
            (catLower.contains('air condition') && (cLower.contains('air condition') || cLower.contains('hvac'))) ||
            (catLower.contains('plumbing') && cLower.contains('plumbing')) ||
            (catLower.contains('electrical') && cLower.contains('electrical')) ||
            (catLower.contains('solar') && cLower.contains('solar')) ||
            (catLower.contains('pest') && (cLower.contains('pest') || cLower.contains('clean')));
      },
      orElse: () => categories.isNotEmpty
          ? categories.first
          : ServiceCategory(id: catId, name: catName, slug: '', description: ''),
    );

    return AiStructuredOutput(
      reportedProblemSummary: text.trim(),
      suggestedCategoryName: matched.name,
      suggestedCategoryId: matched.id,
      suggestedProfessionalType: proType,
      estimatedUrgency: urgency,
      clarifyingQuestions: questions,
      draftTitle: title,
      draftDescription:
          'Customer reported: "$text". Requires professional on-site diagnostics, inspection of underlying causes, and itemized quotation approval prior to work.',
    );
  }
}
