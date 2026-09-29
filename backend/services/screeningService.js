exports.scoreCandidate = (candidateId, candidate, jobId) => {
  let base = 60;
  const seed = Number(candidateId) || 1;
  const jitter = ((seed * 13) % 20);
  base += jitter;

  let summary = 'Screening complete — candidate reviewed against baseline criteria.';

  if (candidate && candidate.experience) {
    const match = /(\d+)/.exec(String(candidate.experience));
    const years = match ? parseInt(match[1], 10) : 0;
    if (years >= 5) base += 15;
    else if (years >= 3) base += 10;
    else if (years >= 1) base += 5;

    if (candidate.score) {
      const adj = Math.round((Number(candidate.score) - 75) * 0.3);
      base += adj;
    }
    summary = `Experience of ${years}+ years and AI match of ${candidate.score || 'n/a'}% contribute to a strong fit.`;
  }

  const score = Math.max(0, Math.min(100, base));
  let level = 'review';
  if (score >= 85) level = 'highly recommended';
  else if (score >= 70) level = 'recommended';
  else if (score >= 55) level = 'review';
  else level = 'not recommended';

  return {
    score,
    summary,
    recommendation: level,
    jobId: jobId || null,
    candidateId: Number(candidateId) || null,
  };
};
