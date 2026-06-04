document.addEventListener('DOMContentLoaded', () => {
  // ===== DOM REFERENCES =====
  const clubList = document.getElementById('clubResults');
  const leagueFilter = document.getElementById('leagueFilter');
  const locationFilter = document.getElementById('locationFilter');
  const ageGroupFilter = document.getElementById('ageGroupFilter');
  const beginnerFriendlyFilter = document.getElementById('beginnerFriendlyFilter');
  const youthFilter = document.getElementById('youthFilter');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sortBy');
  const filterBtn = document.getElementById('clubSearchBtn'); // matches your HTML

  const panel = document.getElementById('clubPanel');
  const panelBody = document.getElementById('panelBody');
  const panelClose = document.getElementById('panelClose');

  // ===== DATA & STATE =====
  let allClubs = [];
  let lastClubsFiltered = [];
  let currentPage = 1;
  const pageSize = 20;

  // ===== MAP =====
  let map;
  let markerLayer;

  function initMap() {
    const container = document.getElementById('mapContainer');
    if (!container) return;

    if (!map) {
      map = L.map('mapContainer').setView([54.5, -3], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markerLayer = L.layerGroup().addTo(map);
    }
  }

  function updateMapMarkers(clubs) {
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();
    const bounds = [];

    clubs.forEach(club => {
      const rawLat = club.location?.latitude;
      const rawLng = club.location?.longitude;

      if (rawLat === null || rawLat === "" || rawLng === null || rawLng === "") return;

      const lat = Number(rawLat);
      const lng = Number(rawLng);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng]).addTo(markerLayer);
      marker.clubId = club.id;

      marker.on('click', function () {
        const clickedClub = allClubs.find(c => c.id === this.clubId);
        if (!clickedClub) return;
        openClubPanel(clickedClub);
        map.setView([lat, lng], 13);
      });

      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([54.5, -3], 6);
    }
  }

  // ===== FETCH DATA =====
  fetch('data/football/clubs.json')
    .then(res => res.json())
    .then(data => {
      allClubs = data || [];
      lastClubsFiltered = [...allClubs];

      populateFilters(allClubs);

      initMap();
      applyFilterAndRender(); // initial render
    })
    .catch(err => console.error('Error loading clubs.json', err));

  // ===== FILTER POPULATION =====
  function populateFilters(clubs) {
    const leagues = [...new Set(clubs.map(c => c.league).filter(Boolean))];
    const locations = [...new Set(clubs.map(c => c.location?.county).filter(Boolean))];
    const ageGroups = [...new Set(clubs.map(c => c.age_group).filter(Boolean))];
    const beginnerFriendly = [...new Set(clubs.map(c => c.attributes?.beginner_friendly || c.beginner_friendly).filter(Boolean))];
    const youthTeams = [...new Set(clubs.map(c => c.attributes?.youth_teams || c.youth_teams).filter(Boolean))];

    fillSelect(leagueFilter, leagues, 'All Leagues');
    fillSelect(locationFilter, locations, 'All Counties');
    fillSelect(ageGroupFilter, ageGroups, 'All Age Groups');
    fillSelect(beginnerFriendlyFilter, beginnerFriendly, 'All Options');
    fillSelect(youthFilter, youthTeams, 'All Options');
  }

  function fillSelect(selectEl, items, defaultLabel) {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      selectEl.appendChild(opt);
    });
  }

  // ===== SORTING =====
  const leagueOrder = [
    "Women's Super League",
    "Women's Super League 2",
    "FA Women's National League - Northern Premier Division",
    "FA Women's National League - Southern Premier Division",
    "FA Women's National League - Division One North",
    "FA Women's National League - Division One Midlands",
    "FA Women's National League - Division One South East",
    "FA Women's National League - Division One South West"
  ];

  function sortByLeagueThenAlphabetical(clubs) {
    return [...clubs].sort((a, b) => {
      const leagueA = leagueOrder.indexOf(a.league);
      const leagueB = leagueOrder.indexOf(b.league);

      // League order first
      if (leagueA !== leagueB) {
        return leagueA - leagueB;
      }

      // Alphabetical inside each league
      return a.name.localeCompare(b.name);
    });
  }



  function sortClubs(clubs, method) {
    switch (method) {
      case "alpha":
        return [...clubs].sort((a, b) => a.name.localeCompare(b.name));

      case "location":
        return [...clubs].sort((a, b) =>
          (a.location?.county || "").localeCompare(b.location?.county || "")
        );

      case "league":
      default:
        return sortByLeagueThenAlphabetical(clubs);
    }
  }


  function applyFilterAndRender() {
    const league = leagueFilter?.value || '';
    const location = locationFilter?.value || '';
    const ageGroup = ageGroupFilter?.value || '';
    const beginnerFriendly = beginnerFriendlyFilter?.value || '';
    const youth = youthFilter?.value || '';
    const searchValue = (searchInput?.value || '').trim().toLowerCase();
    const sortMethod = sortSelect?.value || "league";

    const filtered = allClubs.filter(club => {
      const matchesSearch =
        !searchValue ||
        club.name.toLowerCase().includes(searchValue) ||
        (club.location?.county || '').toLowerCase().includes(searchValue) ||
        (club.attributes?.beginner_friendly || '').toLowerCase().includes(searchValue) ||
        (club.attributes?.youth_teams || '').toLowerCase().includes(searchValue);

      const matchesLeague = !league || club.league === league;
      const matchesLocation = !location || (club.location?.county || '').toLowerCase().includes(location.toLowerCase());
      const matchesAgeGroup = !ageGroup || club.age_group === ageGroup;
      const matchesBeginnerFriendly =
        !beginnerFriendly ||
        (club.attributes?.beginner_friendly || '').toLowerCase() === beginnerFriendly.toLowerCase();
      const matchesYouth =
        !youth ||
        (club.attributes?.youth_teams || '').toLowerCase() === youth.toLowerCase();

      return (
        matchesSearch &&
        matchesLeague &&
        matchesLocation &&
        matchesAgeGroup &&
        matchesBeginnerFriendly &&
        matchesYouth
      );
    });

    const sorted = sortClubs(filtered, sortMethod);

    lastClubsFiltered = sorted;
    currentPage = 1;

    renderClubs(sorted);
    updateMapMarkers(sorted);
  }


  // ===== RENDER LIST & PAGINATION =====
  function renderClubs(clubs) {
    if (!clubList) return;

    const totalPages = Math.max(1, Math.ceil(clubs.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const clubsToShow = clubs.slice(start, end);

    let html = '';

    if (clubsToShow.length === 0) {
      html = `<li class="empty">No clubs found.</li>`;
    } else {
      clubsToShow.forEach(club => {
        html += `
<li 
  data-id="${club.id}"
  data-name="${club.name || ''}"
  data-location="${club.location?.county || ''}"
  data-league="${club.league || ''}"
  data-age-group="${club.age_group || ''}"
  data-logo="${club.branding?.logo || club.logo || ''}"
  data-stadium="${club.location?.stadium || club.stadium || ''}"
  data-website="${club.contact?.website || club.website || ''}"
  data-social-link="${club.contact?.social_link || club.social_link || ''}"
  data-beginner-friendly="${club.attributes?.beginner_friendly || club.beginner_friendly || ''}"
  data-youth="${club.attributes?.youth_teams || club.youth_teams || ''}"
  data-join-method="${club.attributes?.join_method || club.join_method || ''}"
>
  <div style="display:flex; align-items:center; gap:16px;">
    ${club.branding?.logo ? `<img src="${club.branding.logo}" loading="lazy" alt="${club.name} logo" class="club-logo">` : ''}
    <div style="flex:1;">
      <strong>${club.name}</strong><br/>
      <em>${club.league}</em><br/>
      <span>${club.location?.county || ''}</span><br/>
      <div class="club-badges">
        <span class="age-badge" data-age-group="${club.age_group}">${club.age_group}</span>
      </div>
    </div>
  </div>
</li>
`;
      });
    }

    clubList.innerHTML = html;
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    let pagination = document.getElementById('pagination');

    if (!pagination) {
      pagination = document.createElement('div');
      pagination.id = 'pagination';
      pagination.style.textAlign = 'center';
      pagination.style.margin = '20px 0';
      if (clubList && clubList.parentNode) {
        clubList.parentNode.appendChild(pagination);
      }
    }

    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    if (currentPage > 1) {
      const prev = document.createElement('button');
      prev.textContent = 'Prev';
      prev.onclick = () => {
        currentPage--;
        renderClubs(lastClubsFiltered);
      };
      pagination.appendChild(prev);
    }

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.disabled = true;
      btn.onclick = () => {
        currentPage = i;
        renderClubs(lastClubsFiltered);
      };
      pagination.appendChild(btn);
    }

    if (currentPage < totalPages) {
      const next = document.createElement('button');
      next.textContent = 'Next';
      next.onclick = () => {
        currentPage++;
        renderClubs(lastClubsFiltered);
      };
      pagination.appendChild(next);
    }
  }

  // ===== PANEL =====
  function openClubPanel(club) {
    if (!club || !panel || !panelBody) return;

    const {
      name,
      league,
      age_group,
      branding,
      contact,
      attributes,
      location
    } = club;

    panelBody.innerHTML = `
      <h2>${name}</h2>

      ${branding?.logo ? `<img src="${branding.logo}" alt="${name} logo" class="panel-logo">` : ''}

      <p><strong>League:</strong> ${league}</p>
      <p><strong>Location:</strong> ${location?.county || 'Not available'}</p>
      <p><strong>Stadium:</strong> ${location?.stadium || 'Not available'}</p>

      <p><strong>Website:</strong>
        ${contact?.website ? `<a href="${contact.website}" target="_blank">${name}</a>` : 'Not available'}
      </p>

      <p><strong>Instagram:</strong>
        ${contact?.social_link ? `<a href="${contact.social_link}" target="_blank">Visit</a>` : 'Not available'}
      </p>

      <p><strong>Age Group:</strong> 
        <span class="age-badge" data-age-group="${age_group}">${age_group}</span>
      </p>

      <p><strong>Beginner Friendly?</strong> 
        <span class="beginner-badge" data-beginner-friendly="${attributes?.beginner_friendly}">
          ${attributes?.beginner_friendly || 'Not available'}
        </span>
      </p>

      <p><strong>Youth Teams?</strong> 
        <span class="youth-badge" data-youth="${attributes?.youth_teams}">
          ${attributes?.youth_teams || 'Not available'}
        </span>
      </p>

      <p><strong>Join Method:</strong> 
        <span class="join-method" data-join-method="${attributes?.join_method}">
          ${attributes?.join_method || 'Not available'}
        </span>
      </p>
    `;

    panel.classList.add('open');
  }

  // ===== EVENT LISTENERS =====
  if (clubList && panel && panelBody) {
    clubList.addEventListener('click', event => {
      const li = event.target.closest('li');
      if (!li) return;

      const id = Number(li.dataset.id);
      const club = allClubs.find(c => c.id === id);
      if (!club) return;

      openClubPanel(club);

      if (map && club.location?.latitude && club.location?.longitude) {
        const lat = Number(club.location.latitude);
        const lng = Number(club.location.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 13);
        }
      }
    });
  }

  if (panelClose && panel) {
    panelClose.addEventListener('click', () => {
      panel.classList.remove('open');
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', e => {
      e.preventDefault();
      applyFilterAndRender();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      applyFilterAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applyFilterAndRender();
    });
  }

  if (leagueFilter) leagueFilter.addEventListener('change', applyFilterAndRender);
  if (locationFilter) locationFilter.addEventListener('change', applyFilterAndRender);
  if (ageGroupFilter) ageGroupFilter.addEventListener('change', applyFilterAndRender);
  if (beginnerFriendlyFilter) beginnerFriendlyFilter.addEventListener('change', applyFilterAndRender);
  if (youthFilter) youthFilter.addEventListener('change', applyFilterAndRender);
});
