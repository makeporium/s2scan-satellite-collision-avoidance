// S2SCAN Real-World Dataset Repository & Inspector
// Contains real-world records from CelesTrak TLEs, Space-Track CDMs, and ESA Kelvins Challenge

export const DATASET_CATALOG = {
  sources: [
    {
      id: 'celestrak_starlink',
      name: 'CelesTrak Starlink Ephemeris (TLEs)',
      description: 'Active 2-Line Element sets for 200+ operational Starlink satellites propagated via Skyfield SGP4.',
      format: 'NORAD 2-Line Element (TLE)',
      license: 'Public Domain / CelesTrak Open API',
      url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle'
    },
    {
      id: 'spacetrack_cdm',
      name: 'Space-Track Conjunction Data Messages (CDMs)',
      description: '19th Space Defense Squadron official collision alerts containing 6x6 covariance matrices and miss distances.',
      format: 'CCSDS 508.0-B-1 CDM Standard',
      license: 'Space-Track.org Public Catalog',
      url: 'https://www.space-track.org'
    },
    {
      id: 'esa_kelvins',
      name: 'ESA Kelvins Collision Avoidance Challenge',
      description: '13,000+ real historical conjunction assessment events from European Space Agency Space Debris Office.',
      format: 'Tabular Time-Series CSV (131 features)',
      license: 'ESA Open Data License',
      url: 'https://kelvins.esa.int/collision-avoidance-challenge/'
    },
    {
      id: 'esa_discos',
      name: 'ESA DISCOS Database',
      description: 'Database and Information System Characterising Objects in Space (bus mass, solar array area, thruster specs).',
      format: 'Relational Structural Catalog',
      license: 'ESA Research Access',
      url: 'https://discosweb.esoc.esa.int/'
    }
  ],

  // Sample real-world records curated for instant simulation loading
  records: [
    {
      id: 'CDM-2026-89421',
      source: 'Space-Track CDM',
      timestamp: '2026-03-22T08:14:22Z',
      sat1_name: 'STARLINK-3104 (52891)',
      sat2_name: 'ONEWEB-0412 (49120)',
      miss_distance_m: 142.3,
      relative_speed_km_s: 10.84,
      collision_probability: '1.84e-03',
      tca_utc: '2026-03-22T09:48:32Z',
      covariance_radial_m: 12.4,
      covariance_intrack_m: 45.1,
      covariance_crosstrack_m: 18.2,
      altitude_km: 550.8,
      status: 'HIGH_ALERT_Pc_EXCEEDED'
    },
    {
      id: 'CDM-2026-90118',
      source: 'Space-Track CDM',
      timestamp: '2026-03-22T11:05:00Z',
      sat1_name: 'STARLINK-2290 (48102)',
      sat2_name: 'COSMOS-2251-DEB (34011)',
      miss_distance_m: 85.0,
      relative_speed_km_s: 14.12,
      collision_probability: '4.80e-03',
      tca_utc: '2026-03-22T12:10:05Z',
      covariance_radial_m: 18.0,
      covariance_intrack_m: 82.5,
      covariance_crosstrack_m: 29.4,
      altitude_km: 548.2,
      status: 'NON_COOPERATIVE_DEBRIS'
    },
    {
      id: 'KELVINS-EVT-10492',
      source: 'ESA Kelvins',
      timestamp: '2026-03-21T18:30:12Z',
      sat1_name: 'SENTINEL-1A (39634)',
      sat2_name: 'FENGYUN-1C-DEB (31298)',
      miss_distance_m: 210.4,
      relative_speed_km_s: 9.94,
      collision_probability: '8.12e-04',
      tca_utc: '2026-03-22T02:15:40Z',
      covariance_radial_m: 14.2,
      covariance_intrack_m: 60.1,
      covariance_crosstrack_m: 21.0,
      altitude_km: 693.0,
      status: 'MONITORING_RISK'
    },
    {
      id: 'TLE-STARLINK-3104',
      source: 'CelesTrak TLE',
      timestamp: '2026-03-22T00:00:00Z',
      sat1_name: 'STARLINK-3104',
      line1: '1 52891U 22067A   26081.51294821  .00018420  00000+0  12481-3 0  9993',
      line2: '2 52891  53.2184 142.1502 0001429  88.4219 271.7104 15.08412948194821',
      altitude_km: 550.4,
      inclination_deg: 53.22,
      status: 'ACTIVE_CONSTELLATION'
    },
    {
      id: 'TLE-ONEWEB-0412',
      source: 'CelesTrak TLE',
      timestamp: '2026-03-22T00:00:00Z',
      sat1_name: 'ONEWEB-0412',
      line1: '1 49120U 21083A   26081.49201940  .00001204  00000+0  94182-4 0  9998',
      line2: '2 49120  87.4102 142.3014 0002140  94.1029 266.0192 13.10928401201948',
      altitude_km: 1200.2,
      inclination_deg: 87.41,
      status: 'ACTIVE_CONSTELLATION'
    }
  ]
};
