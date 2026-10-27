'use client';

import React from 'react';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
}

export function ScoreRing({ score, maxScore = 100, size = 160, label = 'Readiness' }: ScoreRingProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(score / maxScore, 1);
  const dashOffset = circumference * (1 - percentage);

  const getScoreColor = () => {
    if (percentage >= 0.8) return '#10b981';
    if (percentage >= 0.6) return '#f59e0b';
    if (percentage >= 0.4) return '#f97316';
    return '#ef4444';
  };

  const getScoreGradientId = `score-gradient-${score}`;

  return (
    <div className="flex flex-col items-center gap-2" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={maxScore} aria-label={`${label}: ${score} out of ${maxScore}`}>
      <svg width={size} height={size} className="drop-shadow-lg">
        <defs>
          <linearGradient id={getScoreGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getScoreColor()} stopOpacity="1" />
            <stop offset="100%" stopColor={getScoreColor()} stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="score-ring-bg"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="score-ring-value animate-score-fill"
          stroke={`url(#${getScoreGradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter="url(#glow)"
        />
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[#f1f5f9] text-3xl font-bold"
          style={{ fontSize: `${size / 5}px`, fontWeight: 700 }}
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[#94a3b8]"
          style={{ fontSize: `${size / 12}px` }}
        >
          / {maxScore}
        </text>
      </svg>
      <span className="text-sm text-[#94a3b8] font-medium">{label}</span>
    </div>
  );
}
