import { useEffect, useRef } from 'react'
import { NoticeBanner, PhoneFrame, TabBar } from './components/Shell'
import { routeStops, stationName } from './lib/routing'
import HomeScreen from './screens/HomeScreen'
import MoveScreen from './screens/MoveScreen'
import MyScreen from './screens/MyScreen'
import RouteScreen from './screens/RouteScreen'
import { StoreProvider, useStore } from './state/store'

/** 이동 중 상태 감시: 자동 진행 · 하차 사전 알림 · 도착 알림 · 환승 안내 */
function JourneyEngine() {
  const s = useStore()
  const j = s.journey
  const last = useRef<{ id: string; index: number } | null>(null)

  useEffect(() => {
    if (!j?.auto || j.arrived) return
    const t = setInterval(() => s.advance(1), 3500)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j?.auto, j?.arrived])

  useEffect(() => {
    if (!j) {
      last.current = null
      return
    }
    const prev = last.current
    last.current = { id: j.route.id, index: j.index }
    if (!prev || prev.id !== j.route.id || prev.index === j.index) return
    const stops = routeStops(j.route)
    const left = stops.length - 1 - j.index
    const cur = stops[j.index]
    const dest = stationName(j.route.to)
    if (left === 0) {
      s.notify({ title: `${dest}역에 도착했어요`, body: '지금 하차하세요 · 두고 내리는 물건이 없는지 확인하세요', tone: 'success' }, { silent: !j.alertOn, duration: 6000 })
      return
    }
    if (j.alertOn && left === s.alertBefore) {
      s.notify({ title: left === 1 ? `다음 역은 ${dest}역입니다` : `${left}정거장 후 ${dest}역`, body: '내릴 준비를 해 주세요', tone: 'warn' }, { duration: 6000 })
      return
    }
    if (cur.transferTo) {
      s.notify(
        { title: `${stationName(cur.station)}역 · ${cur.transferTo}호선 환승`, body: '스마트 환승으로 환승 가능 여부를 확인하세요', tone: 'info', action: { label: '스마트 환승 열기', run: () => (s.setMoveTab('transfer'), s.setTab('move')) } },
        { silent: !j.alertOn },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j?.index, j?.route.id])

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', s.largeText)
  }, [s.largeText])

  return null
}

function Screens() {
  const { tab } = useStore()
  return (
    <div className="flex h-full flex-col">
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {tab === 'home' && <HomeScreen />}
        {tab === 'route' && <RouteScreen />}
        {tab === 'move' && <MoveScreen />}
        {tab === 'my' && <MyScreen />}
      </main>
      <TabBar />
      <NoticeBanner />
      <JourneyEngine />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <PhoneFrame>
        <Screens />
      </PhoneFrame>
    </StoreProvider>
  )
}
