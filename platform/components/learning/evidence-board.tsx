"use client";
import { motion, useReducedMotion } from "motion/react";
import type { Evidence } from "@/lib/learning/evidence";
import "./learning.css";
export function EvidenceBoard({ changes }: { changes: Evidence[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="learning-evidence" aria-label="Recorded state changes">
      {changes.length === 0 ? (
        <p>No recorded values changed between these steps.</p>
      ) : (
        changes.map((c) => (
          <div className="learning-change" key={c.id}>
            <strong>{c.label}</strong>
            <div>
              <code>{c.before}</code>
              <span aria-label="changes to">→</span>
              <motion.code
                key={c.after}
                initial={{ opacity: reduced ? 1 : 0.3, y: reduced ? 0 : 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {c.after}
              </motion.code>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
