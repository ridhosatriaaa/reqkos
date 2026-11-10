import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const API_BASE = 'http://localhost:8000'
const facilityOptions = ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Water Heater', 'Dapur', 'Parkir Mobil']
const roomImages = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
]

const getKostImage = (kost) => {
  const index = Number.parseInt((kost?.id_kost || 'KST000').replace(/\D/g, ''), 10) || 0
  return roomImages[index % roomImages.length]
}

const currency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v || 0))

const createMarkerIcon = (color, isSelected = false) =>
  L.divIcon({
    className: 'custom-map-pin',
    html: `<span style="background:${color}; transform: scale(${isSelected ? 1.25 : 1});" class="map-pin-dot"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  })

const createCampusPinIcon = () =>
  L.divIcon({
    className: 'gmaps-campus-pin',
    html: `
      <div style="position:relative; width:26px; height:34px; transform:translate(-13px, -34px);">
        <svg width="26" height="34" viewBox="0 0 30 38" fill="none">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23s15-12.5 15-23c0-8.284-6.716-15-15-15z" fill="#ea4335"/>
          <circle cx="15" cy="14" r="5" fill="#ffffff"/>
        </svg>
      </div>`,
    iconSize: [26, 34],
    iconAnchor: [0, 0],
    popupAnchor: [0, -34],
  })

const createOriginPinIcon = () =>
  L.divIcon({
    className: 'gmaps-origin-pin',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: #1a73e8;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        transform: translate(-8px, -8px);
      "></div>`,
    iconSize: [16, 16],
    iconAnchor: [0, 0],
    popupAnchor: [0, -8],
  })

const createTimeBadgeIcon = (durationMin, isAlt = false) =>
  L.divIcon({
    className: 'gmaps-time-badge',
    html: `
      <div style="
        background: ${isAlt ? '#ffffff' : '#1a73e8'};
        color: ${isAlt ? '#3c4043' : '#ffffff'};
        border: ${isAlt ? '1px solid #dadce0' : '1px solid #174ea6'};
        border-radius: 9999px;
        padding: 4px 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        user-select: none;
      ">
        <span>${durationMin} min</span>
      </div>`,
    iconSize: [70, 24],
    iconAnchor: [0, 0],
  })

const parseFacilities = (v) =>
  String(v || '').split(',').map((s) => s.trim()).filter(Boolean)

const WhatsAppIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.82 11.82 0 00-3.476-8.414" />
  </svg>
)

const formatWhatsAppUrl = (phone, kostName) => {
  if (!phone) return '#'
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1)
  } else if (!digits.startsWith('62')) {
    digits = '62' + digits
  }
  const text = encodeURIComponent(
    `Halo, saya tertarik dengan ${kostName || 'kost'} di aplikasi Roome. Apakah kamar masih tersedia?`
  )
  return `https://wa.me/${digits}?text=${text}`
}

function MapViewUpdater({ routeCoords, defaultCenter }) {
  const map = useMap()
  useEffect(() => {
    if (routeCoords && routeCoords.length > 1) {
      const bounds = L.latLngBounds(routeCoords)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    } else if (defaultCenter) {
      map.setView(defaultCenter, 13)
    }
  }, [routeCoords, defaultCenter, map])
  return null
}

function App() {
  const [campuses, setCampuses] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [selectedCampus, setSelectedCampus] = useState('')
  const [selectedGender, setSelectedGender] = useState('Semua')
  const [maxDistance, setMaxDistance] = useState(5)
  const [priceRange, setPriceRange] = useState([500000, 2500000])
  const [selectedFacilities, setSelectedFacilities] = useState([])
  const [sortBy, setSortBy] = useState('Jarak Terdekat')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mapCenter, setMapCenter] = useState([-7.797, 110.37])

  // Route state
  const [selectedKost, setSelectedKost] = useState(null)
  const [routeData, setRouteData] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  // Comparison feature state
  const [compareList, setCompareList] = useState([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/campuses`)
        if (!r.ok) throw new Error()
        const d = await r.json()
        setCampuses(d)
        if (d.length > 0 && !selectedCampus) setSelectedCampus(d[0].nama_kampus)
      } catch {
        setError('Tidak dapat terhubung ke server backend Python (localhost:8000).')
      }
    })()
  }, [])

  const selectedCampusInfo = useMemo(
    () => campuses.find((c) => c.nama_kampus === selectedCampus) || null,
    [campuses, selectedCampus],
  )

  useEffect(() => {
    if (!selectedCampus) return
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const p = new URLSearchParams({
          selected_campus: selectedCampus,
          max_distance_km: String(maxDistance),
          gender_filter: selectedGender,
          price_min: String(priceRange[0]),
          price_max: String(priceRange[1]),
          sort_by: sortBy,
        })
        if (selectedFacilities.length > 0) p.set('facilities', selectedFacilities.join(','))
        const r = await fetch(`${API_BASE}/api/recommendations?${p}`)
        if (!r.ok) throw new Error()
        const d = await r.json()
        const items = d.items || []
        setRecommendations(items)

        if (items.length > 0) {
          setSelectedKost(items[0])
        } else {
          setSelectedKost(null)
          setRouteData(null)
        }
      } catch {
        setError('Gagal memuat rekomendasi kost.')
        setRecommendations([])
        setSelectedKost(null)
        setRouteData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedCampus, selectedGender, maxDistance, priceRange, selectedFacilities, sortBy])

  useEffect(() => {
    if (selectedCampusInfo)
      setMapCenter([Number(selectedCampusInfo.latitude), Number(selectedCampusInfo.longitude)])
  }, [selectedCampusInfo])

  useEffect(() => {
    if (!selectedKost || !selectedCampusInfo) {
      setRouteData(null)
      return
    }

    let isMounted = true
    setRouteLoading(true)

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${selectedKost.longitude},${selectedKost.latitude};${selectedCampusInfo.longitude},${selectedCampusInfo.latitude}?overview=full&geometries=geojson&alternatives=true`
        const res = await fetch(url)
        if (!res.ok) throw new Error()
        const data = await res.json()

        if (data.routes && data.routes.length > 0 && isMounted) {
          const primary = data.routes[0]
          const primaryCoords = primary.geometry.coordinates.map(([lon, lat]) => [lat, lon])
          const primaryDurationMin = Math.max(1, Math.round(primary.duration / 60))
          const primaryDistKm = (primary.distance / 1000).toFixed(1)

          let altRoute = null
          if (data.routes.length > 1) {
            const alt = data.routes[1]
            altRoute = {
              coords: alt.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
              durationMin: Math.max(1, Math.round(alt.duration / 60)),
              distanceKm: (alt.distance / 1000).toFixed(1),
            }
          }

          setRouteData({
            primaryCoords,
            primaryDurationMin,
            primaryDistKm,
            altRoute,
          })
        }
      } catch {
        if (isMounted) {
          const fallbackCoords = [
            [Number(selectedKost.latitude), Number(selectedKost.longitude)],
            [Number(selectedCampusInfo.latitude), Number(selectedCampusInfo.longitude)],
          ]
          const dist = Number(selectedKost.jarak_ke_kampus_km || 2)
          const estMin = Math.max(2, Math.round((dist / 25) * 60))
          setRouteData({
            primaryCoords: fallbackCoords,
            primaryDurationMin: estMin,
            primaryDistKm: dist.toFixed(1),
            altRoute: null,
          })
        }
      } finally {
        if (isMounted) setRouteLoading(false)
      }
    }

    fetchRoute()
    return () => { isMounted = false }
  }, [selectedKost, selectedCampusInfo])

  const toggleFacility = (f) =>
    setSelectedFacilities((c) => (c.includes(f) ? c.filter((x) => x !== f) : [...c, f]))

  const nearest = recommendations.length > 0 ? Number(recommendations[0].jarak_ke_kampus_km || 0) : 0
  const cheapest =
    recommendations.length > 0
      ? Math.min(...recommendations.map((k) => Number(k.harga_per_bulan || 0)))
      : 0

  // ── Comparison Logic ──────────────────────────────────────
  const toggleCompareKost = (kost, e) => {
    if (e) e.stopPropagation()
    setCompareList((prev) => {
      const exists = prev.some((k) => k.id_kost === kost.id_kost)
      if (exists) {
        return prev.filter((k) => k.id_kost !== kost.id_kost)
      }
      if (prev.length >= 3) {
        alert('Maksimal memilih 3 kost untuk dibandingkan.')
        return prev
      }
      return [...prev, kost]
    })
  }

  const selectTopThreeNearest = () => {
    if (recommendations.length < 2) {
      alert('Dibutuhkan minimal 2 kost untuk melakukan perbandingan.')
      return
    }
    const topThree = [...recommendations]
      .sort((a, b) => Number(a.jarak_ke_kampus_km || 0) - Number(b.jarak_ke_kampus_km || 0))
      .slice(0, 3)
    setCompareList(topThree)
    setShowCompareModal(true)
  }

  // Calculate detailed scores for compared items
  const comparisonResults = useMemo(() => {
    if (compareList.length === 0) return null

    const prices = compareList.map((k) => Number(k.harga_per_bulan || 0))
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)

    const dists = compareList.map((k) => Number(k.jarak_ke_kampus_km || 0))
    const minD = Math.min(...dists)
    const maxD = Math.max(...dists)

    const ratings = compareList.map((k) => Number(k.rating || 0))
    const minR = Math.min(...ratings)
    const maxR = Math.max(...ratings)

    const facCounts = compareList.map((k) => parseFacilities(k.fasilitas).length)
    const maxF = Math.max(...facCounts, 1)

    const scoredKosts = compareList.map((k) => {
      const p = Number(k.harga_per_bulan || 0)
      const d = Number(k.jarak_ke_kampus_km || 0)
      const r = Number(k.rating || 0)
      const facsList = parseFacilities(k.fasilitas)
      const fc = facsList.length

      // Scoring formulas (Weights: Harga 30, Jarak 30, Rating 25, Fasilitas 15 = 100)
      const scoreHarga = maxP === minP ? 30 : Math.round(30 * (1 - (p - minP) / (maxP - minP)))
      const scoreJarak = maxD === minD ? 30 : Math.round(30 * (1 - (d - minD) / (maxD - minD)))
      const scoreRating = Math.round(25 * (r / 5.0))
      const scoreFasilitas = Math.round(15 * (fc / maxF))
      const totalScore = scoreHarga + scoreJarak + scoreRating + scoreFasilitas

      // Keunggulan (Strengths) - mutually exclusive to avoid contradiction
      const strengths = []
      if (p === minP) {
        strengths.push(`Tarif sewa paling hemat (${currency(p)}/bln)`)
      } else if (p <= 1000000) {
        strengths.push(`Tarif sewa terjangkau (${currency(p)}/bln)`)
      }

      if (d === minD) {
        strengths.push(`Lokasi paling dekat ke kampus (${d.toFixed(2)} km)`)
      } else if (d <= 1.5) {
        strengths.push(`Jarak dekat ke kampus (${d.toFixed(2)} km)`)
      }

      // Only highlight rating if it's the highest or clearly above others
      if (r === maxR && maxR > minR) {
        strengths.push(`Rating ulasan tertinggi (★ ${r.toFixed(1)})`)
      } else if (r >= 4.7) {
        strengths.push(`Rating ulasan sangat baik (★ ${r.toFixed(1)})`)
      }

      if (fc === maxF && maxF > 0) {
        strengths.push(`Fasilitas terlengkap (${fc} fasilitas)`)
      } else if (facsList.includes('AC') && facsList.includes('Kamar Mandi Dalam')) {
        strengths.push('Kamar mandi dalam & AC')
      }

      if (strengths.length === 0) {
        strengths.push('Kombinasi tarif dan lokasi cukup seimbang')
      }

      // Pertimbangan (Trade-offs / Considerations) - strict checks to prevent conflict
      const considerations = []
      if (p === maxP && maxP > minP) {
        considerations.push(`Tarif sewa paling tinggi (${currency(p)})`)
      }
      if (d === maxD && maxD > minD) {
        considerations.push(`Jarak terjauh ke kampus (${d.toFixed(2)} km)`)
      }
      if (r === minR && minR < maxR) {
        considerations.push(`Rating ulasan relatif terendah (★ ${r.toFixed(1)})`)
      }
      if (!facsList.includes('AC') && considerations.length < 2) {
        considerations.push('Belum dilengkapi fasilitas AC')
      }
      if (!facsList.includes('Kamar Mandi Dalam') && considerations.length < 2) {
        considerations.push('Kamar mandi di luar kamar')
      }

      if (considerations.length === 0) {
        considerations.push('Ketersediaan kamar mengikuti kuota kampus')
      }

      return {
        ...k,
        scoreHarga,
        scoreJarak,
        scoreRating,
        scoreFasilitas,
        totalScore,
        facCount: fc,
        strengths: strengths.slice(0, 2),
        considerations: considerations.slice(0, 2),
      }
    })

    // Find winner
    const winner = [...scoredKosts].sort((a, b) => b.totalScore - a.totalScore)[0]

    // Formulate reasons why the winner won
    const reasons = []
    if (Number(winner.harga_per_bulan) === minP) reasons.push('Tarif paling hemat')
    if (Number(winner.jarak_ke_kampus_km) === minD) reasons.push('Jarak paling dekat')
    if (winner.facCount === maxF && maxF > 0) reasons.push('Fasilitas paling lengkap')
    if (Number(winner.rating) === Math.max(...compareList.map((k) => Number(k.rating || 0)))) {
      reasons.push('Rating tertinggi')
    }
    if (reasons.length === 0) reasons.push('Skor keseluruhan terbaik')

    // Assign specific verdict for each kost
    scoredKosts.forEach((k) => {
      const p = Number(k.harga_per_bulan || 0)
      const d = Number(k.jarak_ke_kampus_km || 0)
      const isWin = k.id_kost === winner.id_kost

      if (isWin) {
        k.verdict = 'Paling direkomendasikan karena memberikan nilai paling seimbang antara biaya, jarak, dan fasilitas.'
      } else if (p === minP) {
        k.verdict = 'Cocok jika prioritas utama Anda adalah efisiensi anggaran sewa bulanan.'
      } else if (d === minD) {
        k.verdict = 'Cocok jika Anda mengutamakan akses cepat dan jarak tempuh terdekat ke kampus.'
      } else if (k.scoreFasilitas >= 14) {
        k.verdict = 'Opsi tepat jika kelengkapan fasilitas kamar menjadi prioritas kenyamanan Anda.'
      } else {
        k.verdict = 'Alternatif yang layak dipertimbangkan sesuai kriteria dan anggaran Anda.'
      }
    })

    return {
      items: scoredKosts,
      winnerId: winner.id_kost,
      winnerName: winner.nama_kost,
      winnerScore: winner.totalScore,
      winnerReasons: reasons,
    }
  }, [compareList])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* ──── Header / Navbar ──── */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
              Roome
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Sistem Rekomendasi Kost
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Yogyakarta
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* ──── Hero with Reference Style Filter Pills ──── */}
        <section
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '28px',
            backgroundImage: "url('https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* Subtle dark gradient overlay */}
          <div style={{
            padding: '48px 28px 36px',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.7) 100%)',
          }}>
            <h1 style={{
              margin: '0 0 28px',
              textAlign: 'center',
              fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}>
              Temukan Kost Dekat Kampus
            </h1>

            {/* Filter grid with exact pill dropdown style from reference */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '14px',
              maxWidth: 960,
              margin: '0 auto',
            }}>
              {/* Kampus */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '6px',
                }}>
                  KAMPUS
                </label>
                <select
                  className="ref-pill-select"
                  style={{ width: '100%' }}
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                >
                  {campuses.map((c) => (
                    <option key={c.id_kampus} value={c.nama_kampus}>
                      {c.nama_kampus}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '6px',
                }}>
                  GENDER
                </label>
                <select
                  className="ref-pill-select"
                  style={{ width: '100%' }}
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                >
                  {['Semua', 'Putra', 'Putri', 'Campur'].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Harga */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '6px',
                }}>
                  HARGA
                </label>
                <select
                  className="ref-pill-select"
                  style={{ width: '100%' }}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([500000, Number(e.target.value)])}
                >
                  {[
                    { l: '≤ 1 jt', v: 1000000 },
                    { l: '≤ 1,5 jt', v: 1500000 },
                    { l: '≤ 2 jt', v: 2000000 },
                    { l: '≤ 2,5 jt', v: 2500000 },
                  ].map((o) => (
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </select>
              </div>

              {/* Urutkan */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '6px',
                }}>
                  URUTKAN
                </label>
                <select
                  className="ref-pill-select"
                  style={{ width: '100%' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {['Jarak Terdekat', 'Harga Termurah', 'Rating Tertinggi', 'Skor Rekomendasi Terbaik'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Facility Filter Pills */}
            <div style={{
              marginTop: '22px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}>
              {facilityOptions.map((f) => {
                const on = selectedFacilities.includes(f)
                return (
                  <button
                    key={f}
                    onClick={() => toggleFacility(f)}
                    style={{
                      borderRadius: '9999px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: on ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.25)',
                      background: on ? '#ffffff' : 'rgba(15, 23, 42, 0.5)',
                      color: on ? '#0f172a' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ──── Error Notification ──── */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#991b1b',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* ──── Stats Row ──── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}>
          {[
            { label: 'Jumlah Kost', value: recommendations.length, sub: 'sesuai filter' },
            { label: 'Jarak Terdekat', value: `${nearest.toFixed(2)} km`, sub: 'dari kampus' },
            { label: 'Harga Termurah', value: currency(cheapest), sub: 'per bulan' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px 20px',
              }}
            >
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                {s.label}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                {s.value}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ──── Map Section ──── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '10px',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Peta Lokasi & Rute
              </h2>
              {selectedCampusInfo && (
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Tujuan: <strong>{selectedCampusInfo.nama_kampus}</strong> ({selectedCampusInfo.kabupaten_kota})
                </p>
              )}
            </div>

            {selectedKost && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#334155',
              }}>
                Rute dari <strong>{selectedKost.nama_kost}</strong>: <span style={{ color: '#1a73e8', fontWeight: 700 }}>{routeLoading ? 'Menghitung…' : `${routeData?.primaryDurationMin || '--'} menit`}</span>
                {routeData?.primaryDistKm && ` (${routeData.primaryDistKm} km)`}
              </div>
            )}
          </div>

          <div style={{
            height: 360,
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            {selectedCampusInfo ? (
              <MapContainer center={mapCenter} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapViewUpdater
                  routeCoords={routeData?.primaryCoords}
                  defaultCenter={mapCenter}
                />

                {/* Alternative Route */}
                {routeData?.altRoute && (
                  <>
                    <Polyline
                      positions={routeData.altRoute.coords}
                      pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
                    />
                    <Polyline
                      positions={routeData.altRoute.coords}
                      pathOptions={{ color: '#94a3b8', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
                    />
                    {routeData.altRoute.coords.length > 2 && (
                      <Marker
                        position={routeData.altRoute.coords[Math.floor(routeData.altRoute.coords.length * 0.55)]}
                        icon={createTimeBadgeIcon(routeData.altRoute.durationMin, true)}
                        interactive={false}
                      />
                    )}
                  </>
                )}

                {/* Primary Route */}
                {routeData?.primaryCoords && (
                  <>
                    <Polyline
                      positions={routeData.primaryCoords}
                      pathOptions={{ color: '#174ea6', weight: 8, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
                    />
                    <Polyline
                      positions={routeData.primaryCoords}
                      pathOptions={{ color: '#1a73e8', weight: 5.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
                    />
                    {routeData.primaryCoords.length > 2 && (
                      <Marker
                        position={routeData.primaryCoords[Math.floor(routeData.primaryCoords.length * 0.45)]}
                        icon={createTimeBadgeIcon(routeData.primaryDurationMin, false)}
                        interactive={false}
                      />
                    )}
                  </>
                )}

                {/* Campus Destination Pin */}
                <Marker
                  position={[Number(selectedCampusInfo.latitude), Number(selectedCampusInfo.longitude)]}
                  icon={createCampusPinIcon()}
                >
                  <Popup>
                    <strong>{selectedCampusInfo.nama_kampus}</strong><br />
                    {selectedCampusInfo.kabupaten_kota}
                  </Popup>
                </Marker>

                {/* Selected Kost Origin Pin */}
                {selectedKost && (
                  <Marker
                    position={[Number(selectedKost.latitude), Number(selectedKost.longitude)]}
                    icon={createOriginPinIcon()}
                  >
                    <Popup>
                      <strong>{selectedKost.nama_kost}</strong><br />
                      {selectedKost.gender} · {Number(selectedKost.rating).toFixed(1)}★<br />
                      {Number(selectedKost.jarak_ke_kampus_km).toFixed(2)} km ke kampus
                      {selectedKost.nomor_whatsapp && (
                        <div style={{ marginTop: '8px' }}>
                          <a
                            href={formatWhatsAppUrl(selectedKost.nomor_whatsapp, selectedKost.nama_kost)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <WhatsAppIcon size={12} color="#16a34a" />
                            Chat WA: {selectedKost.nomor_whatsapp}
                          </a>
                        </div>
                      )}
                    </Popup>
                  </Marker>
                )}

                {/* Other Kost Markers */}
                {recommendations.map((k) => {
                  if (selectedKost && k.id_kost === selectedKost.id_kost) return null
                  return (
                    <Marker
                      key={k.id_kost}
                      position={[Number(k.latitude), Number(k.longitude)]}
                      icon={createMarkerIcon('#d97706')}
                      eventHandlers={{
                        click: () => setSelectedKost(k),
                      }}
                    >
                      <Popup>
                        <strong>{k.nama_kost}</strong><br />
                        {k.gender} · {Number(k.rating).toFixed(1)}★<br />
                        {Number(k.jarak_ke_kampus_km).toFixed(2)} km dari kampus
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedKost(k)}
                            style={{
                              background: '#1a73e8',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            Pilih Rute
                          </button>
                          {k.nomor_whatsapp && (
                            <a
                              href={formatWhatsAppUrl(k.nomor_whatsapp, k.nama_kost)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <WhatsAppIcon size={11} color="#16a34a" />
                              WA
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: '13px',
              }}>
                Memuat data peta…
              </div>
            )}
          </div>
        </div>

        {/* ──── Recommendations Grid Header & Comparison Action ──── */}
        <section>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Daftar Rekomendasi Kost
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                Klik kartu untuk lihat rute di peta, atau pilih kost untuk membandingkan.
              </p>
            </div>

            {/* Comparison Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={selectTopThreeNearest}
                disabled={recommendations.length < 2}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: recommendations.length < 2 ? 'not-allowed' : 'pointer',
                  opacity: recommendations.length < 2 ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Bandingkan 3 Terdekat</span>
              </button>

              {compareList.length > 0 && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  style={{
                    background: '#1a73e8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Buka Perbandingan ({compareList.length})
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '48px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}>
              Memuat data kost…
            </div>
          ) : recommendations.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '48px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}>
              Tidak ada kost yang sesuai kriteria filter.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {recommendations.map((k) => {
                const facs = parseFacilities(k.fasilitas).slice(0, 3)
                const isSelected = selectedKost?.id_kost === k.id_kost
                const isCompared = compareList.some((item) => item.id_kost === k.id_kost)

                return (
                  <article
                    key={k.id_kost}
                    onClick={() => setSelectedKost(k)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: isSelected ? '2px solid #1a73e8' : isCompared ? '2px solid #0f172a' : '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: '#e2e8f0' }}>
                      <img
                        src={getKostImage(k)}
                        alt={k.nama_kost}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = roomImages[0] }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />

                      {/* Gender Badge */}
                      <span style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}>
                        {k.gender}
                      </span>

                      {/* Rating Badge */}
                      <span style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}>
                        <span style={{ color: '#d97706' }}>★</span> {Number(k.rating).toFixed(1)}
                      </span>

                      {isSelected && (
                        <span style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          background: '#1a73e8',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}>
                          Rute Terpilih
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                            {k.nama_kost}
                          </h4>
                          <p style={{ margin: '3px 0 10px', fontSize: '12px', color: '#64748b' }}>
                            {k.nama_kampus_terdekat}
                          </p>
                        </div>

                        {/* Compare toggle button */}
                        <button
                          onClick={(e) => toggleCompareKost(k, e)}
                          title="Tambahkan untuk membandingkan 3 kost"
                          style={{
                            background: isCompared ? '#0f172a' : '#f1f5f9',
                            color: isCompared ? '#ffffff' : '#475569',
                            border: '1px solid ' + (isCompared ? '#0f172a' : '#cbd5e1'),
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isCompared ? '✓ Terpilih' : '+ Banding'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', display: 'block' }}>
                            Harga
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                            {currency(k.harga_per_bulan)}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', display: 'block' }}>
                            Jarak
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                            {Number(k.jarak_ke_kampus_km).toFixed(2)} km
                          </span>
                        </div>
                      </div>

                      {facs.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {facs.map((f) => (
                            <span key={`${k.id_kost}-${f}`} style={{
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '10px',
                              fontWeight: 500,
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* WhatsApp Direct Action Button */}
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <a
                          href={formatWhatsAppUrl(k.nomor_whatsapp, k.nama_kost)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={`Chat WhatsApp ke pemilik kost (${k.nomor_whatsapp || ''})`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '6px 11px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <WhatsAppIcon size={13} color="#16a34a" />
                          <span>{k.nomor_whatsapp || 'Hubungi WA'}</span>
                        </a>

                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Chat Pemilik
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* ──── Floating Comparison Dock at Bottom ──── */}
      {compareList.length > 0 && (
        <aside style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '12px 20px',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '92vw',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: '#1a73e8',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              {compareList.length}/3
            </span>
            <div style={{ fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>Perbandingan Kost:</span>
              <span style={{ color: '#94a3b8', marginLeft: '6px' }}>
                {compareList.map((k) => k.nama_kost).join(', ')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={() => setShowCompareModal(true)}
              disabled={compareList.length < 2}
              style={{
                background: compareList.length >= 2 ? '#2563eb' : '#334155',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: compareList.length >= 2 ? 'pointer' : 'not-allowed',
              }}
            >
              Bandingkan ({compareList.length})
            </button>
            <button
              onClick={() => setCompareList([])}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
          </div>
        </aside>
      )}

      {/* ──── Comparison Modal (Clean, Professional Side-by-Side Table) ──── */}
      {showCompareModal && comparisonResults && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '960px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Perbandingan Kost
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Perbandingan harga, jarak, rating, dan fasilitas antar kost pilihan Anda.
                </p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {/* Winner Note Banner (Clean & Subtle) */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: '#334155',
              }}>
                <div>
                  Pilihan terbaik: <strong style={{ color: '#0f172a' }}>{comparisonResults.winnerName}</strong>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>
                    ({comparisonResults.winnerReasons.join(', ')})
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  Skor: {comparisonResults.winnerScore}/100
                </div>
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${comparisonResults.items.length}, minmax(0, 1fr))`,
                gap: '12px',
              }}>
                {comparisonResults.items.map((k) => {
                  const isWinner = k.id_kost === comparisonResults.winnerId

                  return (
                    <div
                      key={k.id_kost}
                      style={{
                        background: '#ffffff',
                        border: isWinner ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Top label if winner */}
                      {isWinner ? (
                        <div style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 0',
                          letterSpacing: '0.04em',
                        }}>
                          REKOMENDASI UTAMA
                        </div>
                      ) : (
                        <div style={{ height: 4, background: '#f1f5f9' }} />
                      )}

                      {/* Kost image */}
                      <div style={{ height: 110, position: 'relative', background: '#f1f5f9' }}>
                        <img
                          src={getKostImage(k)}
                          alt={k.nama_kost}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          background: 'rgba(15,23,42,0.75)',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}>
                          {k.gender}
                        </span>
                      </div>

                      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                          {k.nama_kost}
                        </h4>

                        {/* Total Score */}
                        <div style={{
                          marginTop: '8px',
                          marginBottom: '12px',
                          padding: '8px 10px',
                          background: isWinner ? '#f1f5f9' : '#fafafa',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Skor Akhir</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                              {k.totalScore}<span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>/100</span>
                            </span>
                          </div>
                          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${k.totalScore}%`,
                              background: isWinner ? '#0f172a' : '#64748b',
                            }} />
                          </div>
                        </div>

                        {/* Breakdown Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '14px' }}>
                          {/* Harga */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span style={{ color: '#64748b' }}>Harga/bln</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{currency(k.harga_per_bulan)}</span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>Skor: {k.scoreHarga}/30</span>
                            </div>
                          </div>

                          {/* Jarak */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span style={{ color: '#64748b' }}>Jarak kampus</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{Number(k.jarak_ke_kampus_km).toFixed(2)} km</span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>Skor: {k.scoreJarak}/30</span>
                            </div>
                          </div>

                          {/* Rating */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <span style={{ color: '#64748b' }}>Rating</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>★ {Number(k.rating).toFixed(1)}</span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>Skor: {k.scoreRating}/25</span>
                            </div>
                          </div>

                          {/* Fasilitas */}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Fasilitas</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{k.facCount} item</span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>Skor: {k.scoreFasilitas}/15</span>
                            </div>
                          </div>
                        </div>

                        {/* Catatan Analisis */}
                        <div style={{
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          fontSize: '11px',
                          marginBottom: '14px',
                        }}>
                          {/* Keunggulan */}
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '3px' }}>
                              Keunggulan:
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {k.strengths?.map((s, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', color: '#1e293b', lineHeight: 1.35 }}>
                                  <span style={{ color: '#0f172a' }}>•</span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Pertimbangan */}
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '3px' }}>
                              Perlu diperhatikan:
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {k.considerations?.map((c, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', color: '#64748b', lineHeight: 1.35 }}>
                                  <span>•</span>
                                  <span>{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Kesimpulan */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            fontSize: '10.5px',
                            lineHeight: 1.35,
                            color: '#334155',
                          }}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Kesimpulan: </span>
                            {k.verdict}
                          </div>
                        </div>

                        {/* Action: WhatsApp & Select Route */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {k.nomor_whatsapp && (
                            <a
                              href={formatWhatsAppUrl(k.nomor_whatsapp, k.nama_kost)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textDecoration: 'none',
                              }}
                            >
                              <WhatsAppIcon size={12} color="#16a34a" />
                              <span>Chat WA ({k.nomor_whatsapp})</span>
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedKost(k)
                              setShowCompareModal(false)
                            }}
                            style={{
                              width: '100%',
                              background: isWinner ? '#0f172a' : '#f8fafc',
                              color: isWinner ? '#ffffff' : '#0f172a',
                              border: '1px solid ' + (isWinner ? '#0f172a' : '#cbd5e1'),
                              borderRadius: '6px',
                              padding: '7px 10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Pilih Rute Peta
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334155',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
