'use client';

import React, { useState, useEffect } from 'react';

// ==========================================
// 1. 타입 정의 그릇 (Types)
// ==========================================
interface TeamScore {
  teamId: string;
  teamName: string;
  professionalScore: number; // 전문심사 점수 (0-100)
  audienceScore: number;     // 청중평가 점수 (0-100)
  tieBreakerBonus?: number;  // 동점 발생 시 활용할 2차 기준 변수 (그릇)
}

interface ScoringConfig {
  professionalWeight: number; // 전문심사 비율 (예: 0.7)
  audienceWeight: number;     // 청중평가 비율 (예: 0.3)
}

interface CalculatedTeamResult extends TeamScore {
  finalScore: number;
  rank: number;
}

// ==========================================
// 2. 조건문과 반복문을 활용한 순수 계산 및 동점 방지 로직
// ==========================================
function calculateRankingsWithNoTies(
  teams: TeamScore[],
  config: ScoringConfig
): CalculatedTeamResult[] {
  // 1단계: 가중치 반영 및 기본 점수 계산 (그릇 매핑)
  let calculated: CalculatedTeamResult[] = teams.map((team) => {
    const baseScore =
      team.professionalScore * config.professionalWeight +
      team.audienceScore * config.audienceWeight;
    
    // 2차 기준 변수(tieBreakerBonus)를 더해 고유한 값 유도
    const bonus = team.tieBreakerBonus || 0;
    const finalScore = Math.round((baseScore + bonus) * 100) / 100;

    return {
      ...team,
      finalScore,
      rank: 0,
    };
  });

  // 2단계: 반복문(Bubble Sort 방식)과 조건문을 이용한 엄격한 정렬 (동점 원천 차단)
  for (let i = 0; i < calculated.length; i++) {
    for (let j = i + 1; j < calculated.length; j++) {
      let shouldSwap = false;

      // 조건문 A: 최종 점수가 뒷 팀보다 낮으면 자리를 바꿈
      if (calculated[i].finalScore < calculated[j].finalScore) {
        shouldSwap = true;
      } 
      // 조건문 B: 만약 최종 점수가 정확히 같다면? (동점 발생 상황)
      else if (calculated[i].finalScore === calculated[j].finalScore) {
        // 2차 기준 1순위: 전문심사 점수가 더 높은 팀을 상위로 배치
        if (calculated[i].professionalScore < calculated[j].professionalScore) {
          shouldSwap = true;
        } 
        // 2차 기준 2순위: 전문심사마저 같다면 팀 ID(문자열)를 비교하여 강제로 순서 결정 (동점 완전 배제)
        else if (calculated[i].professionalScore === calculated[j].professionalScore) {
          if (calculated[i].teamId > calculated[j].teamId) {
            shouldSwap = true;
          }
        }
      }

      // 조건에 따른 위치 교환 수행
      if (shouldSwap) {
        let temp = calculated[i];
        calculated[i] = calculated[j];
        calculated[j] = temp;
      }
    }
  }

  // 3단계: 반복문을 이용해 절대 겹치지 않는 고유 순위 부여
  for (let i = 0; i < calculated.length; i++) {
    calculated[i].rank = i + 1;
  }

  return calculated;
}

// ==========================================
// 3. 목업 데이터 그릇 (Mock Data) - 나중에 Supabase 연동 시 이 부분을 대체
// ==========================================
const initialMockConfig: ScoringConfig = {
  professionalWeight: 0.7, // 전문심사 70%
  audienceWeight: 0.3,     // 청중평가 30%
};

const initialMockScores: TeamScore[] = [
  { teamId: 't-01', teamName: 'Nexus AI 플랫폼', professionalScore: 90.0, audienceScore: 90.0, tieBreakerBonus: 0.5 },
  { teamId: 't-02', teamName: 'GameCraft 엔진', professionalScore: 90.0, audienceScore: 90.0, tieBreakerBonus: 0.2 }, // 원래 점수가 같으나 보너스로 동점 방지
  { teamId: 't-03', teamName: 'BizVision 분석기', professionalScore: 85.0, audienceScore: 85.0, tieBreakerBonus: 0.0 },
  { teamId: 't-04', teamName: 'EcoChain 물류', professionalScore: 80.0, audienceScore: 88.0, tieBreakerBonus: 0.0 },
];

// ==========================================
// 4. UI 컴포넌트 및 메인 페이지 (실시간 반영)
// ==========================================
export default function RankingsPage() {
  const [config, setConfig] = useState<ScoringConfig>(initialMockConfig);
  const [scores, setScores] = useState<TeamScore[]>(initialMockScores);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);

  // 실시간 점수 변동 시뮬레이션 (실제 환경에서는 Supabase Realtime 구독 코드가 들어갈 그릇)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveActive) {
      interval = setInterval(() => {
        setScores((prevScores) =>
          prevScores.map((team) => ({
            ...team,
            // 청중평가 점수가 실시간으로 미세하게 변동되는 상황 연출
            audienceScore: Math.min(100, Math.max(50, Math.round((team.audienceScore + (Math.random() * 2 - 1)) * 10) / 10)),
          }))
        );
      }, 1500); // 1.5초마다 실시간 갱신
    }
    return () => clearInterval(interval);
  }, [isLiveActive]);

  // 동점자가 절대 나오지 않는 순위 계산 함수 실행
  const rankedResults = calculateRankingsWithNoTies(scores, config);

  const handleWeightChange = (proWeight: number) => {
    const audienceWeight = Math.round((1 - proWeight) * 100) / 100;
    setConfig({
      professionalWeight: proWeight,
      audienceWeight: audienceWeight,
    });
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">제24회 배재대학교 경영대학 학술제</h1>
          <p className="text-gray-600">NEXUS Event Platform - 실시간 집계 및 동점 없는 순위 보드</p>
        </div>
        <button
          onClick={() => setIsLiveActive(!isLiveActive)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isLiveActive ? 'bg-red-500 text-white animate-pulse' : 'bg-green-600 text-white'
          }`}
        >
          {isLiveActive ? '🔴 실시간 집계 중지' : '🟢 실시간 집계 시작'}
        </button>
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

      {/* 결과 테이블 (동점자 없음 보장) */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">최종 순위표 (동점 허용 안 함)</h2>
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">팀 명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전문심사</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">청중평가 (실시간)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최종 점수</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankedResults.map((team) => (
                <tr key={team.teamId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-blue-600">
                    {team.rank}위
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
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