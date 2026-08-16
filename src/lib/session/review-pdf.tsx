import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ReviewDocumentSnapshot } from "./review-document";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, color: "#1f5f3f" },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 16 },
  phaseTitle: { fontSize: 14, marginTop: 18, marginBottom: 8, color: "#1f5f3f", borderBottom: "1 solid #1f5f3f", paddingBottom: 4 },
  resumeBox: { marginBottom: 16, padding: 10, backgroundColor: "#f4f6f4", borderRadius: 4 },
  resumeLabel: { fontSize: 9, color: "#555555", marginBottom: 2 },
  resumeCode: { fontSize: 13, fontWeight: 700, color: "#1b3219" },
  resumeNote: { fontSize: 8, color: "#666666", marginTop: 4 },
  sectionTitle: { fontSize: 11, marginTop: 10, marginBottom: 4, fontWeight: 700 },
  questionBlock: { marginBottom: 8 },
  question: { fontWeight: 700, marginBottom: 2 },
  answer: { color: "#222222" },
  followUp: { color: "#555555", marginLeft: 8, marginTop: 2, fontStyle: "italic" },
  noAnswer: { color: "#999999", fontStyle: "italic" },
});

function ReviewPdfDocument({ snapshot }: { snapshot: ReviewDocumentSnapshot }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>EGS Marketing Solutions — Onboarding Review</Text>
        <Text style={styles.subtitle}>Generated {new Date(snapshot.generatedAt).toLocaleString()}</Text>

        {snapshot.resumeCode && (
          <View style={styles.resumeBox}>
            <Text style={styles.resumeLabel}>Your resume code (use with your email and business name to resume or edit):</Text>
            <Text style={styles.resumeCode}>{snapshot.resumeCode}</Text>
            {(snapshot.businessName || snapshot.contactEmail) && (
              <Text style={styles.resumeNote}>
                {[snapshot.businessName, snapshot.contactEmail].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>
        )}

        {snapshot.phases.map((phase) => (
          <View key={phase.phaseKey} wrap>
            <Text style={styles.phaseTitle}>{phase.phaseName}</Text>
            {phase.sections.map((section, sectionIndex) => (
              <View key={sectionIndex}>
                <Text style={styles.sectionTitle}>{section.sectionName}</Text>
                {section.questions.map((q) => (
                  <View key={q.questionKey} style={styles.questionBlock} wrap={false}>
                    <Text style={styles.question}>{q.prompt}</Text>
                    <Text style={q.answer ? styles.answer : styles.noAnswer}>{q.answer ?? "No answer provided"}</Text>
                    {q.followUps.map((f, i) => (
                      <Text key={i} style={styles.followUp}>
                        Follow-up: {f.aiQuestionText} {f.clientResponseText ? `— ${f.clientResponseText}` : ""}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function renderReviewPdf(snapshot: ReviewDocumentSnapshot): Promise<Buffer> {
  return renderToBuffer(<ReviewPdfDocument snapshot={snapshot} />);
}
