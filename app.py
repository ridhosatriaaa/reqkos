from __future__ import annotations

import math
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).resolve().parent


@lru_cache(maxsize=1)
def load_datasets() -> tuple[pd.DataFrame, pd.DataFrame]:
    campus_path = find_file("kampus20.csv")
    kost_path = find_file("kost100.csv")

    campus_df = pd.read_csv(campus_path)
    kost_df = pd.read_csv(kost_path)

    for col in ["latitude", "longitude"]:
        campus_df[col] = pd.to_numeric(campus_df[col], errors="coerce")
        kost_df[col] = pd.to_numeric(kost_df[col], errors="coerce")

    for col in ["rating", "harga_per_bulan", "jumlah_ulasan", "jarak_ke_kampus_km"]:
        if col in kost_df.columns:
            kost_df[col] = pd.to_numeric(kost_df[col], errors="coerce")

    campus_df = campus_df.dropna(subset=["latitude", "longitude"]).copy()
    kost_df = kost_df.dropna(subset=["latitude", "longitude"]).copy()

    kost_df["fasilitas"] = kost_df["fasilitas"].fillna("")
    kost_df["gender"] = kost_df["gender"].fillna("Campur").astype(str)
    kost_df["nama_kost"] = kost_df["nama_kost"].fillna("Nama Kost Tidak Tersedia")

    return campus_df, kost_df


@st.cache_data
def load_datasets_streamlit() -> tuple[pd.DataFrame, pd.DataFrame]:
    return load_datasets()


def find_file(filename: str) -> Path:
    candidate_paths = [
        ROOT_DIR / filename,
        ROOT_DIR / "data" / filename,
        Path(r"d:\Downloads\daftar_20_kampus_jogja.csv").with_name(filename),
        Path(r"d:\Downloads\daftar_100_kost_jogja.csv").with_name(filename),
    ]

    for candidate in candidate_paths:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        f"Tidak ditemukan file {filename}. Pastikan file CSV ada di folder kerja atau di folder Downloads."
    )


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def matches_facility_filter(fasilitas_text: str, selected_facilities: list[str]) -> bool:
    if not selected_facilities:
        return True

    normalized = fasilitas_text.lower()
    return all(facility.lower() in normalized for facility in selected_facilities)


def build_recommendations_df(
    selected_campus: str,
    max_distance_km: float,
    gender_filter: str,
    min_rating: float,
    price_min: int,
    price_max: int,
    selected_facilities: list[str],
    sort_by: str,
) -> pd.DataFrame:
    campus_df, kost_df = load_datasets()

    if selected_campus not in campus_df["nama_kampus"].values:
        return pd.DataFrame(
            columns=[
                "id_kost",
                "nama_kost",
                "gender",
                "rating",
                "jumlah_ulasan",
                "harga_per_bulan",
                "fasilitas",
                "jarak_ke_kampus_km",
                "latitude",
                "longitude",
                "nama_kampus_terdekat",
                "score_rekomendasi",
                "nomor_whatsapp",
            ]
        )

    campus = campus_df[campus_df["nama_kampus"] == selected_campus].iloc[0]
    temp_df = kost_df.copy()
    temp_df["jarak_ke_kampus_km"] = temp_df.apply(
        lambda row: haversine_km(
            campus["latitude"],
            campus["longitude"],
            row["latitude"],
            row["longitude"],
        ),
        axis=1,
    )

    temp_df = temp_df[temp_df["jarak_ke_kampus_km"] <= max_distance_km].copy()

    if gender_filter != "Semua":
        temp_df = temp_df[temp_df["gender"].str.lower() == gender_filter.lower()].copy()

    temp_df = temp_df[
        (temp_df["harga_per_bulan"] >= price_min)
        & (temp_df["harga_per_bulan"] <= price_max)
    ].copy()

    temp_df = temp_df[temp_df["rating"] >= min_rating].copy()

    if selected_facilities:
        temp_df = temp_df[
            temp_df["fasilitas"].apply(
                lambda facilities: matches_facility_filter(facilities, selected_facilities)
            )
        ].copy()

    if temp_df.empty:
        return temp_df

    max_distance = temp_df["jarak_ke_kampus_km"].max() if not temp_df.empty else max_distance_km
    max_distance = max(max_distance, 1.0)

    temp_df["score_rekomendasi"] = (
        0.7 * ((max_distance - temp_df["jarak_ke_kampus_km"]) / max_distance).clip(lower=0, upper=1)
        + 0.3 * (temp_df["rating"] / 5.0)
    )

    if sort_by == "Jarak Terdekat":
        temp_df = temp_df.sort_values(["jarak_ke_kampus_km", "rating"], ascending=[True, False]).reset_index(drop=True)
    elif sort_by == "Harga Termurah":
        temp_df = temp_df.sort_values(["harga_per_bulan", "rating"], ascending=[True, False]).reset_index(drop=True)
    elif sort_by == "Rating Tertinggi":
        temp_df = temp_df.sort_values(["rating", "jumlah_ulasan"], ascending=[False, False]).reset_index(drop=True)
    else:
        temp_df = temp_df.sort_values(["score_rekomendasi", "rating"], ascending=[False, False]).reset_index(drop=True)

    temp_df["jarak_ke_kampus_km"] = temp_df["jarak_ke_kampus_km"].round(2)
    temp_df["score_rekomendasi"] = temp_df["score_rekomendasi"].round(4)
    temp_df["nama_kampus_terdekat"] = selected_campus

    return temp_df[
        [
            "id_kost",
            "nama_kost",
            "gender",
            "rating",
            "jumlah_ulasan",
            "harga_per_bulan",
            "fasilitas",
            "jarak_ke_kampus_km",
            "latitude",
            "longitude",
            "nama_kampus_terdekat",
            "score_rekomendasi",
            "nomor_whatsapp",
        ]
    ]


@st.cache_data
def build_recommendations(
    selected_campus: str,
    max_distance_km: float,
    gender_filter: str,
    min_rating: float,
    price_range: tuple[int, int],
    selected_facilities: tuple[str, ...],
    sort_by: str,
) -> pd.DataFrame:
    return build_recommendations_df(
        selected_campus=selected_campus,
        max_distance_km=max_distance_km,
        gender_filter=gender_filter,
        min_rating=min_rating,
        price_min=price_range[0],
        price_max=price_range[1],
        selected_facilities=list(selected_facilities),
        sort_by=sort_by,
    )


def price_label(value: int) -> str:
    return f"Rp {value:,.0f}"


def render_card(row: pd.Series) -> None:
    st.markdown(
        f"""
        <div style="
            border: 1px solid #dfe6ee;
            border-radius: 16px;
            padding: 18px;
            background: linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%);
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            margin-bottom: 16px;
        ">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
                <div>
                    <h4 style="margin: 0 0 6px 0; font-size: 1.05rem;">{row['nama_kost']}</h4>
                    <span style="display:inline-block; background:#E8F3FF; color:#0d6efd; border-radius:999px; padding:5px 10px; font-size:0.75rem; font-weight:600;">{row['gender']}</span>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.8rem; color:#666;">Rating</div>
                    <div style="font-weight:700; color:#f59e0b;">⭐ {row['rating']:.1f}</div>
                </div>
            </div>
            <div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px;">
                <div style="background:#f8fafc; border-radius:10px; padding:7px 10px; font-size:0.8rem;">💰 {price_label(int(row['harga_per_bulan']))}/bln</div>
                <div style="background:#f8fafc; border-radius:10px; padding:7px 10px; font-size:0.8rem;">🧭 {row['jarak_ke_kampus_km']:.2f} km</div>
                <div style="background:#f8fafc; border-radius:10px; padding:7px 10px; font-size:0.8rem;">👥 {int(row['jumlah_ulasan'])} ulasan</div>
            </div>
            <div style="margin-top: 12px; font-size:0.9rem; color:#374151;">
                <strong>Fasilitas:</strong> {row['fasilitas']}
            </div>
            <div style="margin-top: 8px; font-size:0.85rem; color:#475569;">
                <strong>Skor:</strong> {row['score_rekomendasi']:.3f}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def main() -> None:
    st.set_page_config(page_title="Rekomendasi Kost Jogja", page_icon="🏠", layout="wide")
    st.markdown(
        """
        <style>
            .block-container { padding-top: 1.5rem; }
            .stMetric { background: #f8fafc; border-radius: 12px; padding: 12px; }
        </style>
        """,
        unsafe_allow_html=True,
    )

    campus_df, _ = load_datasets_streamlit()

    st.title("🏠 Sistem Rekomendasi Kost di Yogyakarta")
    st.caption("Cari kost terdekat dari kampus pilihan Anda dengan filter yang dapat dikustomisasi.")

    with st.sidebar:
        st.header("Filter Kampus & Kost")
        selected_campus = st.selectbox(
            "Pilih Kampus Acuan",
            sorted(campus_df["nama_kampus"].tolist()),
            index=0,
        )
        max_distance_km = st.slider("Batas Jarak Maksimal (km)", 0.5, 10.0, 5.0, step=0.5)
        gender_filter = st.selectbox("Filter Gender", ["Semua", "Putra", "Putri", "Campur"])
        price_range = st.slider(
            "Rentang Harga per Bulan",
            min_value=500000,
            max_value=2500000,
            value=(500000, 2500000),
            step=50000,
        )
        min_rating = st.slider("Rating Minimum", 1.0, 5.0, 3.0, step=0.1)

        facilities_options = [
            "AC",
            "WiFi",
            "Kamar Mandi Dalam",
            "Water Heater",
            "Dapur",
            "Parkir Mobil",
        ]
        selected_facilities = st.multiselect(
            "Fasilitas yang diinginkan",
            facilities_options,
            default=[],
        )

        sort_by = st.selectbox(
            "Urutkan Berdasarkan",
            [
                "Jarak Terdekat",
                "Harga Termurah",
                "Rating Tertinggi",
                "Skor Rekomendasi Terbaik",
            ],
        )

    st.subheader(f"Kampus Acuan: {selected_campus}")
    campus_detail = campus_df[campus_df["nama_kampus"] == selected_campus].iloc[0]
    st.write(
        f"Lokasi: {campus_detail['kabupaten_kota']} | Koordinat: ({campus_detail['latitude']}, {campus_detail['longitude']})"
    )

    results = build_recommendations(
        selected_campus=selected_campus,
        max_distance_km=max_distance_km,
        gender_filter=gender_filter,
        min_rating=min_rating,
        price_range=price_range,
        selected_facilities=tuple(selected_facilities),
        sort_by=sort_by,
    )

    if results.empty:
        st.warning("Tidak ada kost yang memenuhi kriteria filter yang Anda pilih.")
        return

    metrics_col1, metrics_col2, metrics_col3 = st.columns(3)
    metrics_col1.metric("Jumlah Kost Ditemukan", len(results))
    metrics_col2.metric("Jarak Terdekat", f"{results['jarak_ke_kampus_km'].min():.2f} km")
    metrics_col3.metric("Harga Termurah", price_label(int(results['harga_per_bulan'].min())))

    display_df = results.copy()
    display_df["harga_per_bulan"] = display_df["harga_per_bulan"].map(price_label)
    display_df["rating"] = display_df["rating"].map(lambda x: f"{x:.1f}")
    display_df["jarak_ke_kampus_km"] = display_df["jarak_ke_kampus_km"].map(lambda x: f"{x:.2f} km")
    display_df["score_rekomendasi"] = display_df["score_rekomendasi"].map(lambda x: f"{x:.3f}")

    csv_buffer = display_df.to_csv(index=False)
    st.download_button(
        label="⬇️ Unduh Hasil Rekomendasi (.csv)",
        data=csv_buffer,
        file_name="rekomendasi_kost.csv",
        mime="text/csv",
    )

    st.subheader("Daftar Rekomendasi Kost")
    cards = results.copy()

    for _, row in cards.iterrows():
        render_card(row)

    st.subheader("Tabel Detail")
    table_df = results[[
        "id_kost",
        "nama_kost",
        "gender",
        "rating",
        "jumlah_ulasan",
        "harga_per_bulan",
        "fasilitas",
        "jarak_ke_kampus_km",
        "score_rekomendasi",
    ]].copy()

    table_df["harga_per_bulan"] = table_df["harga_per_bulan"].map(price_label)
    table_df["rating"] = table_df["rating"].map(lambda x: f"{x:.1f}")
    table_df["jarak_ke_kampus_km"] = table_df["jarak_ke_kampus_km"].map(lambda x: f"{x:.2f} km")
    table_df["score_rekomendasi"] = table_df["score_rekomendasi"].map(lambda x: f"{x:.3f}")

    st.dataframe(table_df, use_container_width=True)


app = FastAPI(title="Rekomendasi Kost API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok"}


@app.get("/api/campuses")
def get_campuses() -> list[dict[str, Any]]:
    campus_df, _ = load_datasets()
    return campus_df[["id_kampus", "nama_kampus", "kabupaten_kota", "latitude", "longitude"]].to_dict(orient="records")


@app.get("/api/recommendations")
def get_recommendations(
    selected_campus: str = Query(..., description="Nama kampus acuan"),
    max_distance_km: float = Query(5.0, ge=0.5, le=10.0),
    gender_filter: str = Query("Semua"),
    min_rating: float = Query(3.0, ge=1.0, le=5.0),
    price_min: int = Query(500000, ge=500000, le=2500000),
    price_max: int = Query(2500000, ge=500000, le=2500000),
    facilities: str = Query("", description="Kata kunci fasilitas dipisah koma"),
    sort_by: str = Query("Jarak Terdekat"),
) -> dict[str, Any]:
    selected_facilities = [item.strip() for item in facilities.split(",") if item.strip()]
    df = build_recommendations_df(
        selected_campus=selected_campus,
        max_distance_km=max_distance_km,
        gender_filter=gender_filter,
        min_rating=min_rating,
        price_min=price_min,
        price_max=price_max,
        selected_facilities=selected_facilities,
        sort_by=sort_by,
    )

    return {
        "count": int(len(df)),
        "items": df.to_dict(orient="records"),
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Rekomendasi Kost backend")
    parser.add_argument("--mode", choices=["streamlit", "api"], default="streamlit")
    args = parser.parse_args()

    if args.mode == "api":
        import uvicorn

        uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
    else:
        main()
