import { useMemo, useState } from 'react'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { useSimulation } from '../hooks/useSimulation'
import {
  LESSONS,
  connectionSatisfied,
  stepComplete,
  type Lesson,
} from '../domain/lessons'

/**
 * Right-hand guided-lesson panel. Drives the "버튼형 실습" flow: pick a lesson,
 * then step through info → wiring (checked live against the real connections
 * you make in 3D) → simulate (run and watch the LED light up).
 */
export default function LessonPanel() {
  const wires = useSimulatorStore((s) => s.wires)
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const startLesson = useSimulatorStore((s) => s.startLesson)
  const toggleSimulation = useSimulatorStore((s) => s.toggleSimulation)
  const reset = useSimulatorStore((s) => s.reset)
  const { ledOn } = useSimulation()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  const step = lesson?.steps[stepIndex]
  const complete = step ? stepComplete(step, wires) : false
  const isLast = lesson ? stepIndex === lesson.steps.length - 1 : false

  const expectMet = useMemo(() => {
    if (step?.kind !== 'simulate' || !step.expectLedOn) return false
    return step.expectLedOn.every((id) => ledOn[id])
  }, [step, ledOn])

  const begin = (l: Lesson) => {
    startLesson(l.setup)
    setLesson(l)
    setStepIndex(0)
  }

  const exit = () => {
    setLesson(null)
    setStepIndex(0)
    reset()
  }

  // Lesson picker.
  if (!lesson || !step) {
    return (
      <div className="pointer-events-auto absolute right-4 top-4 z-10 flex w-64 flex-col gap-3 rounded-xl bg-slate-900/80 p-4 text-slate-100 shadow-lg backdrop-blur">
        <div>
          <h2 className="text-base font-semibold">실습 (Lessons)</h2>
          <p className="text-xs text-slate-400">
            단계별로 직접 결선하고 시뮬레이션해 보세요.
          </p>
        </div>
        {LESSONS.map((l) => (
          <button
            key={l.id}
            onClick={() => begin(l)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-sky-500"
          >
            ▶ {l.title} 시작
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-10 flex max-h-[calc(100vh-2rem)] w-64 flex-col gap-3 overflow-y-auto rounded-xl bg-slate-900/85 p-4 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{lesson.title}</h2>
        <button
          onClick={exit}
          className="text-xs text-slate-400 hover:text-red-400"
        >
          종료
        </button>
      </div>

      {/* Step progress dots. */}
      <div className="flex gap-1">
        {lesson.steps.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full ${
              i < stepIndex
                ? 'bg-emerald-500'
                : i === stepIndex
                  ? 'bg-sky-400'
                  : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-sky-400">
          Step {stepIndex + 1} / {lesson.steps.length}
        </p>
        <h3 className="text-sm font-semibold">{step.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {step.body}
        </p>
      </div>

      {/* Wiring checklist. */}
      {step.kind === 'wiring' && step.requiredConnections && (
        <ul className="flex flex-col gap-1.5">
          {step.requiredConnections.map((c) => {
            const done = connectionSatisfied(c, wires)
            return (
              <li
                key={c.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                  done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800/70'
                }`}
              >
                <span>{done ? '✓' : '○'}</span>
                <span>{c.label}</span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Simulation controls. */}
      {step.kind === 'simulate' && (
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleSimulation}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isRunning ? '■ 정지' : '▶ 실행'}
          </button>
          {isRunning && (
            <p
              className={`rounded-lg px-2 py-1.5 text-xs ${
                expectMet
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {expectMet
                ? '🎉 성공! LED에 불이 들어왔어요.'
                : '아직 LED가 꺼져 있어요. 결선을 다시 확인해 보세요.'}
            </p>
          )}
        </div>
      )}

      {/* Navigation. */}
      <div className="mt-1 flex gap-2">
        <button
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="flex-1 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-600 disabled:opacity-40"
        >
          이전
        </button>
        {!isLast && (
          <button
            onClick={() => setStepIndex((i) => i + 1)}
            disabled={!complete}
            className="flex-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step.kind === 'wiring' && !complete ? '결선 필요' : '다음'}
          </button>
        )}
      </div>
    </div>
  )
}
