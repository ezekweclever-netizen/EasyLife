import 'package:flutter/material.dart';
import '../../models/ai_assistant_model.dart';
import '../../models/service_category.dart';
import '../../services/ai_assistant_service.dart';
import '../../services/booking_service.dart';
import '../../shared/buttons.dart';
import '../../theme/easylife_theme.dart';
import '../customer/service_request_screen.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _inputController = TextEditingController();
  final _aiService = AiAssistantService();
  final _bookingService = BookingService();

  List<ServiceCategory> _categories = [];
  final List<AiMessage> _messages = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _messages.add(
      AiMessage(
        id: 'msg-welcome',
        text:
            'Hello! I am your EasyLife AI Problem Assistant. Describe what went wrong with your generator, AC, plumbing, or electrical system in plain English, and I will identify the right trade specialist and prepare your service request.',
        isUser: false,
        timestamp: DateTime.now(),
      ),
    );
  }

  Future<void> _loadCategories() async {
    final cats = await _bookingService.fetchCategories();
    if (mounted) {
      setState(() => _categories = cats);
    }
  }

  void _handleSend([String? presetText]) {
    final text = presetText ?? _inputController.text.trim();
    if (text.isEmpty) return;

    if (presetText == null) {
      _inputController.clear();
    }

    setState(() {
      _messages.add(
        AiMessage(
          id: 'user-${DateTime.now().millisecondsSinceEpoch}',
          text: text,
          isUser: true,
          timestamp: DateTime.now(),
        ),
      );
      _isLoading = true;
    });

    // Simulate intelligent analysis using rule-based diagnostic engine
    Future.delayed(const Duration(milliseconds: 600), () {
      final output = _aiService.analyzeProblem(text, _categories);

      if (mounted) {
        setState(() {
          _isLoading = false;
          _messages.add(
            AiMessage(
              id: 'ai-${DateTime.now().millisecondsSinceEpoch}',
              text:
                  'I have analyzed your reported issue regarding "${output.reportedProblemSummary}". Based on the symptoms described, this is categorized under ${output.suggestedCategoryName}.',
              isUser: false,
              timestamp: DateTime.now(),
              structuredOutput: output,
            ),
          );
        });
      }
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, size: 20, color: EasyLifeColors.teal500),
            SizedBox(width: 8),
            Text('EasyLife AI Assistant'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Disclaimer Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: EasyLifeColors.surfaceMutedGrey,
            child: const Row(
              children: [
                Icon(Icons.info_outline, size: 14, color: EasyLifeColors.charcoal600),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'AI identifies trade categories & drafts requests. Confirmed diagnosis is performed on-site by verified technicians.',
                    style: TextStyle(fontSize: 10, color: EasyLifeColors.charcoal600),
                  ),
                ),
              ],
            ),
          ),

          // Messages Stream
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final m = _messages[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: m.isUser
                        ? CrossAxisAlignment.end
                        : CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.85,
                        ),
                        decoration: BoxDecoration(
                          color: m.isUser
                              ? EasyLifeColors.teal600
                              : EasyLifeColors.surfaceWhite,
                          borderRadius: BorderRadius.circular(14),
                          border: m.isUser
                              ? null
                              : Border.all(color: EasyLifeColors.borderGrey),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          m.text,
                          style: TextStyle(
                            color: m.isUser ? Colors.white : EasyLifeColors.navy900,
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ),
                      if (m.structuredOutput != null) ...[
                        const SizedBox(height: 10),
                        _buildStructuredCard(m.structuredOutput!),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),

          // Suggested Prompts Chips
          if (_messages.length <= 2)
            Container(
              height: 40,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _buildPromptPill(
                      'Generator starts and shuts down after 5 mins'),
                  _buildPromptPill('AC is blowing warm air and dripping water'),
                  _buildPromptPill('Borehole pump not pushing water to overhead tank'),
                ],
              ),
            ),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: EasyLifeColors.surfaceWhite,
              border: Border(top: BorderSide(color: EasyLifeColors.borderGrey)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      decoration: InputDecoration(
                        hintText: 'Describe what is wrong...',
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide:
                              const BorderSide(color: EasyLifeColors.borderGrey),
                        ),
                      ),
                      onSubmitted: (_) => _handleSend(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.arrow_upward_rounded,
                            color: EasyLifeColors.teal600),
                    onPressed: _isLoading ? null : () => _handleSend(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromptPill(String text) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(text, style: const TextStyle(fontSize: 11)),
        backgroundColor: EasyLifeColors.teal50,
        side: const BorderSide(color: EasyLifeColors.teal500, width: 0.8),
        onPressed: () => _handleSend(text),
      ),
    );
  }

  Widget _buildStructuredCard(AiStructuredOutput o) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: EasyLifeColors.surfaceWhite,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: EasyLifeColors.teal500, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: EasyLifeColors.teal600.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology, color: EasyLifeColors.teal700, size: 20),
              const SizedBox(width: 8),
              const Text(
                'AI Structured Recommendation',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: EasyLifeColors.navy900,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: EasyLifeColors.teal50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  o.estimatedUrgency.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.teal800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Recommended Trade: ${o.suggestedCategoryName}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: EasyLifeColors.teal800,
            ),
          ),
          Text(
            'Artisan: ${o.suggestedProfessionalType}',
            style: const TextStyle(fontSize: 12, color: EasyLifeColors.charcoal700),
          ),
          if (o.clarifyingQuestions.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text(
              'Clarifying Questions for the Technician:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            ...o.clarifyingQuestions.map(
              (q) => Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text('• $q', style: const TextStyle(fontSize: 11, color: EasyLifeColors.charcoal700)),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: EasyLifeColors.surfaceMutedGrey,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              o.disclaimer,
              style: const TextStyle(fontSize: 10, color: EasyLifeColors.charcoal500),
            ),
          ),
          const SizedBox(height: 16),
          EasyButton(
            label: 'Review & Draft Service Request',
            icon: Icons.edit_note,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ServiceRequestScreen(
                    preselectedCategory: _categories.firstWhere(
                      (c) => c.id == o.suggestedCategoryId,
                      orElse: () => ServiceCategory(
                        id: o.suggestedCategoryId,
                        name: o.suggestedCategoryName,
                        slug: '',
                        description: '',
                      ),
                    ),
                    initialTitle: o.draftTitle,
                    initialDescription: o.draftDescription,
                    initialUrgency: o.estimatedUrgency,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
