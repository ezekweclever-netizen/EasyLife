class AiMessage {
  final String id;
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final AiStructuredOutput? structuredOutput;

  AiMessage({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.structuredOutput,
  });
}

class AiStructuredOutput {
  final String reportedProblemSummary;
  final String suggestedCategoryName;
  final String suggestedCategoryId;
  final String suggestedProfessionalType;
  final String estimatedUrgency;
  final List<String> clarifyingQuestions;
  final String draftTitle;
  final String draftDescription;
  final String disclaimer;

  const AiStructuredOutput({
    required this.reportedProblemSummary,
    required this.suggestedCategoryName,
    required this.suggestedCategoryId,
    required this.suggestedProfessionalType,
    required this.estimatedUrgency,
    this.clarifyingQuestions = const [],
    required this.draftTitle,
    required this.draftDescription,
    this.disclaimer =
        'Disclaimer: This analysis is based on your reported description and does not constitute a confirmed on-site technical diagnosis.',
  });
}
