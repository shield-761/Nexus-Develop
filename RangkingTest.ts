'use client';

import React, { useState } from 'react';

// ==========================================
// 1. 타입 정의 (Types)
// ==========================================
interface TeamScore {
  teamId: string;
  teamName: string;
  professionalScore: number; // 전문심사 점수 (0-100)
  audienceScore: number;     // 청중평가 점수 (0-100)
}

interface ScoringConfig {
  professionalWeight: number; // 전문심사 비율 (예: 0.7)
  audienceWeight: number;     // 청중평가 비율 (예: 0.3)
}

interface CalculatedTeamResult extends TeamScore {
  finalScore: number;
  rank: number;
  isTied: boolean;            // 동점 여부
}

// ==========================================
// 2. 순수 계산 로직 (Calculator Logic)
// ==========================================
function calculateRankings(
  teams: TeamScore[],
  config: ScoringConfig
): CalculatedTeamResult[] {
  // 1. 가중치 반영 최종 점수 계산
  const calculated = teams.map((team) => {
    const finalScore =
      team.professionalScore * config.professionalWeight +
      team.audienceScore * config.audienceWeight;
    
    return {
      ...team,
      finalScore: Math.round(finalScore * 100) / 100, // 소수점 둘째 자리 반올림
      rank: 1,
      isTied: false,
    };
  });

  // 2. 최종 점수 기준 내림차순 정렬
  calculated.sort((a, b) => b.finalScore - a.finalScore);

  // 3. 순위 부여 및 동점(Tie) 처리
  for (let i = 0; i < calculated.length; i++) {
    if (i > 0 && calculated[i].finalScore === calculated[i - 1].finalScore) {
      calculated[i].rank = calculated[i - 1].rank;
      calculated[i].isTied = true;
      calculated[i - 1].isTied = true; // 동점인 이전 팀도 함께 표시
    } else {
      calculated[i].rank = i + 1;
    }
  }

  return calculated;
}

// ==========================================
// 3. 목업 데이터 (Mock Data)
// ==========================================
const initialMockConfig: ScoringConfig = {
  professionalWeight: 0.7, // 전문심사 70%
  audienceWeight: 0.3,     // 청중평가 30%
};

const initialMockScores: TeamScore[] = [
  { teamId: 't-01', teamName: 'Nexus AI 플랫폼', professionalScore: 92.5, audienceScore: 88.0 },
  { teamId: 't-02', teamName: 'GameCraft 엔진', professionalScore: 90.0, audienceScore: 95.0 },
  { teamId: 't-03', teamName: 'BizVision 분석기', professionalScore: 85.0, audienceScore: 85.0 },
  { teamId: 't-04', teamName: 'EcoChain 물류', professionalScore: 90.0, audienceScore: 95.0 }, // 동점 테스트용
];

// ==========================================
// 4. UI 컴포넌트 및 메인 페이지 (View)
// ==========================================
export default function RankingsPage() {
  const [config, setConfig] = useState<ScoringConfig>(initialMockConfig);
  const [scores] = useState<TeamScore[]>(initialMockScores);

  // 실시간 점수 계산 수행
  const rankedResults = calculateRankings(scores, config);

  const handleWeightChange = (proWeight: number) => {
    const audienceWeight = Math.round((1 - proWeight) * 100) / 100;
    setConfig({
      professionalWeight: proWeight,
      audienceWeight: audienceWeight,
    });
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">제24회 배재대학교 경영대학 학술제</h1>
        <p className="text-gray-600">NEXUS Event Platform - 실시간 점수 집계 및 순위표 (Prototype)</p>
      </div>

      {/* 가중치 조절 컨트롤 패널 */}
      <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">평가 비율 설정 (설정값 기반 분리)</h2>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">
            전문심사: {Math.round(config.professionalWeight * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.professionalWeight}
            onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
            className="w-48 cursor-pointer"
          />
          <label className="text-sm text-gray-600">
            청중평가: {Math.round(config.audienceWeight * 100)}%
          </label>
        </div>
      </div>

      {/* 결과 테이블 컴포넌트 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">현재 최종 순위</h2>
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">팀 명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전문심사</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">청중평가</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최종 점수</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankedResults.map((team) => (
                <tr key={team.teamId} className={team.isTied ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-gray-900">
                    {team.rank}위
                    {team.isTied && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        동점
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {team.teamName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.professionalScore}점
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.audienceScore}점
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    {team.finalScore}점
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}