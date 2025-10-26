document.addEventListener('DOMContentLoaded', () => {
  const clubList = document.getElementById('clubResults');

  // consolidated data store
  let allClubs = [];
  let footballClubs = [];
  let footballLeagues = [];
  let footballLocations = [];
  let cricketClubs = [];
  let cricketLeagues = [];
  let cricketLocations = [];
  let allAgeGroups = [];
  let allSports = [];

  // Pagination variables
  let currentPage = 1;
  const pageSize = 20;
  let lastClubsFiltered = [];

  const $ = id => document.getElementById(id);

  // Fetch and store football data
  fetch('data/football/leagues.json')
    .then(response => response.json())
    .then(leagues => {
      footballLeagues = Array.isArray(leagues) && leagues.length && typeof leagues[0] === 'object'
        ? leagues.map(l => l.name)
        : (leagues || []);
      populateLeagueFilter(footballLeagues);
    })
    .catch(err => console.error('football leagues load error', err));

  fetch('data/football/locations.json')
    .then(response => response.json())
    .then(locations => {
      footballLocations = locations || [];
      // previously passed wrong variable; pass footballLocations
      populateLocationFilter(footballLocations);
    })
    .catch(err => console.error('football locations load error', err));

  fetch('data/football/clubs.json')
    .then(response => response.json())
    .then(clubs => {
      footballClubs = clubs || [];
      allClubs = allClubs.concat(footballClubs);
      allAgeGroups = [...new Set(allClubs.map(club => club.age_group).filter(Boolean))];
      populateAgeGroupFilter(allAgeGroups);
      lastClubsFiltered = allClubs.slice();
      renderClubs(allClubs);
    })
    .catch(err => console.error('football clubs load error', err));

  // Fetch and store Cricket data
  fetch('data/cricket/leagues.json')
    .then(response => response.json())
    .then(leagues => {
      cricketLeagues = Array.isArray(leagues) && leagues.length && typeof leagues[0] === 'object'
        ? leagues.map(l => l.name)
        : (leagues || []);
      // do NOT overwrite football leagues; update only if needed when cricket selected
    })
    .catch(err => console.error('cricket leagues load error', err));

  fetch('data/cricket/locations.json')
    .then(response => response.json())
    .then(locations => {
      cricketLocations = locations || [];
    })
    .catch(err => console.error('cricket locations load error', err));

  fetch('data/cricket/clubs.json')
    .then(response => response.json())
    .then(clubs => {
      cricketClubs = clubs || [];
      allClubs = allClubs.concat(cricketClubs);
      allAgeGroups = [...new Set(allClubs.map(club => club.age_group).filter(Boolean))];
      populateAgeGroupFilter(allAgeGroups);
      lastClubsFiltered = allClubs.slice();
      renderClubs(allClubs);
    })
    .catch(err => console.error('cricket clubs load error', err));

  fetch('data/sports.json')
    .then(response => response.json())
    .then(sports => {
      allSports = sports || [];
      const sportsTabs = document.getElementById('sportTabs');
      if (sportsTabs) {
        sportsTabs.innerHTML = '';

        (sports || []).forEach(sport => {
          const tab = document.createElement('button');
          tab.className = 'sport-tab';
          tab.type = 'button';
          tab.textContent = sport.name;
          tab.dataset.sport = sport.name;
          // include slug if provided (future compatibility)
          if (sport.slug) tab.dataset.slug = sport.slug;
          sportsTabs.appendChild(tab);
        });

        // pick default tab: Football if present, otherwise first sport
        const children = Array.from(sportsTabs.children);
        let defaultTab = children.find(tab => (tab.dataset.sport || '').toLowerCase() === 'football');
        if (!defaultTab) defaultTab = children[0];

        if (defaultTab) {
          defaultTab.classList.add('active');
          const selected = defaultTab.dataset.sport || '';
          // ensure filters reflect selected sport
          updateFiltersForSport(selected);
          filterAndRenderClubs(selected);
        }

        // Tab click event (use closest to handle clicks inside button)
        sportsTabs.addEventListener('click', (e) => {
          const btn = e.target.closest('.sport-tab');
          if (!btn) return;
          document.querySelectorAll('.sport-tab').forEach(tab => tab.classList.remove('active'));
          btn.classList.add('active');
          const selectedSport = btn.dataset.sport || '';
          updateFiltersForSport(selectedSport);
          currentPage = 1;
          filterAndRenderClubs(selectedSport);
        });
      }
    })
    .catch(err => console.error('sports load error', err));

  // Helper functions to populate filters (guard DOM presence)
  function populateLeagueFilter(leagues) {
    const leagueFilter = document.getElementById('leagueFilter');
    if (!leagueFilter) return;
    leagueFilter.innerHTML = '<option value="">All Leagues</option>';
    (leagues || []).forEach(league => {
      const option = document.createElement('option');
      option.value = league;
      option.textContent = league;
      leagueFilter.appendChild(option);
    });
  }

  function populateLocationFilter(locations) {
    const locationFilter = document.getElementById('locationFilter');
    if (!locationFilter) return;
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    (locations || []).forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
  }

  function populateAgeGroupFilter(ageGroups) {
    const ageGroupFilter = document.getElementById('ageGroupFilter');
    if (!ageGroupFilter) return;
    ageGroupFilter.innerHTML = '<option value="">All Age Groups</option>';
    (ageGroups || []).forEach(ageGroup => {
      const option = document.createElement('option');
      option.value = ageGroup;
      option.textContent = ageGroup;
      ageGroupFilter.appendChild(option);
    });
  }

  // Update filters when a sport is selected
  function updateFiltersForSport(selectedSport) {
    const clubsSource = allClubs || [];
    let filteredClubs = clubsSource;
    if (selectedSport) {
      filteredClubs = clubsSource.filter(club => {
        // some club objects may have sport name in different keys
        const name = (club.sport || club.sport_name || '').toString();
        return name === selectedSport;
      });
    }
    // if filteredClubs is empty but we have per-sport arrays (e.g. footballClubs), fall back
    if ((filteredClubs.length === 0) && selectedSport.toLowerCase() === 'football') {
      filteredClubs = footballClubs.slice();
    } else if ((filteredClubs.length === 0) && selectedSport.toLowerCase() === 'cricket') {
      filteredClubs = cricketClubs.slice();
    }

    const leagues = [...new Set(filteredClubs.map(club => club.league).filter(Boolean))];
    const locations = [...new Set(filteredClubs.map(club => club.location).filter(Boolean))];
    const ageGroups = [...new Set(filteredClubs.map(club => club.age_group).filter(Boolean))];

    populateLeagueFilter(leagues);
    populateLocationFilter(locations);
    populateAgeGroupFilter(ageGroups);
  }

  function filterAndRenderClubs(selectedSport = '') {
    const leagueEl = document.getElementById('leagueFilter');
    const locationEl = document.getElementById('locationFilter');
    const ageGroupEl = document.getElementById('ageGroupFilter');
    const league = leagueEl ? leagueEl.value : '';
    const location = locationEl ? locationEl.value : '';
    const ageGroup = ageGroupEl ? ageGroupEl.value : '';

    const filtered = (allClubs || []).filter(club => {
      const matchesSport = !selectedSport || ((club.sport || club.sport_name || '') === selectedSport) ||
        (selectedSport.toLowerCase() === 'football' && footballClubs.includes(club)) ||
        (selectedSport.toLowerCase() === 'cricket' && cricketClubs.includes(club));
      if (!matchesSport) return false;
      if (league && club.league !== league) return false;
      if (location && club.location !== location) return false;
      if (ageGroup && club.age_group !== ageGroup) return false;
      return true;
    });

    lastClubsFiltered = filtered;
    currentPage = 1;
    renderClubs(filtered);
  }

  // Update filter button to use filterAndRenderClubs (guard)
  const filterBtn = document.getElementById('filterSearchBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.sport-tab.active');
      const selectedSport = activeTab ? activeTab.dataset.sport : '';
      filterAndRenderClubs(selectedSport);
    });
  }

  // Listen for search form submit (guard)
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const searchValue = (document.getElementById('search')?.value || '').trim().toLowerCase();
      const activeTab = document.querySelector('.sport-tab.active');
      const selectedSport = activeTab ? activeTab.dataset.sport : '';
      const league = document.getElementById('leagueFilter')?.value || '';
      const location = document.getElementById('locationFilter')?.value || '';
      const ageGroup = document.getElementById('ageGroupFilter')?.value || '';

      const filtered = (allClubs || []).filter(club => {
        const matchesSearch = !searchValue ||
          ((club.name || '').toString().toLowerCase().includes(searchValue)) ||
          ((club.location || '').toString().toLowerCase().includes(searchValue));
        const matchesSport = !selectedSport || ((club.sport || club.sport_name || '') === selectedSport) ||
          (selectedSport.toLowerCase() === 'football' && footballClubs.includes(club)) ||
          (selectedSport.toLowerCase() === 'cricket' && cricketClubs.includes(club));
        const matchesLeague = !league || club.league === league;
        const matchesLocation = !location || club.location === location;
        const matchesAgeGroup = !ageGroup || club.age_group === ageGroup;
        return matchesSearch && matchesSport && matchesLeague && matchesLocation && matchesAgeGroup;
      });

      lastClubsFiltered = filtered;
      currentPage = 1;
      renderClubs(filtered);
    });
  }

  // Function to render clubs with pagination
  function renderClubs(clubs) {
    const clubListEl = document.getElementById('clubResults');
    if (!clubListEl) return;
    clubListEl.innerHTML = '';

    // Pagination logic
    const totalPages = Math.max(1, Math.ceil((clubs || []).length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const clubsToShow = (clubs || []).slice(start, end);

    if (clubsToShow.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty';
      emptyLi.textContent = 'No clubs found.';
      clubListEl.appendChild(emptyLi);
    } else {
      clubsToShow.forEach(club => {
        const li = document.createElement('li');
        li.dataset.name = club.name || '';
        li.dataset.location = club.location || '';
        li.dataset.league = club.league || '';
        li.dataset.ageGroup = club.age_group || '';
        li.dataset.logo = club.logo || '';
        li.dataset.stadium = club.stadium || '';
        li.dataset.website = club.website || '';
        li.dataset.socialLink = club.social_link || '';

        li.innerHTML = `
          <div style="display: flex; align-items: center; gap: 16px;">
            ${club.logo ? `<img src="${club.logo}" alt="${club.name} logo" class="club-logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 6px;">` : ''}
            <div style="flex:1;">
              <strong>${club.name || ''}</strong><br/>
              <em>${club.league || ''}</em><br/>
              <span class="club-location">${club.location || ''}</span><br/>
              <span class="club-age-group">${club.age_group || ''}</span>
            </div>
          </div>
        `;
        clubListEl.appendChild(li);
      });
    }

    renderPagination(totalPages);
  }

  // Pagination controls
  function renderPagination(totalPages) {
    let pagination = document.getElementById('pagination');
    if (!pagination) {
      pagination = document.createElement('div');
      pagination.id = 'pagination';
      pagination.style.textAlign = 'center';
      pagination.style.margin = '20px 0';
      clubList && clubList.parentNode && clubList.parentNode.appendChild(pagination);
    }
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = 'Prev';
      prevBtn.onclick = () => {
        currentPage--;
        renderClubs(lastClubsFiltered);
      };
      pagination.appendChild(prevBtn);
    }

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      if (i === currentPage) pageBtn.disabled = true;
      pageBtn.onclick = () => {
        currentPage = i;
        renderClubs(lastClubsFiltered);
      };
      pagination.appendChild(pageBtn);
    }

    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next';
      nextBtn.onclick = () => {
        currentPage++;
        renderClubs(lastClubsFiltered);
      };
      pagination.appendChild(nextBtn);
    }
  }

  // Modal functionality (guard DOM)
  const modal = document.getElementById('clubModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  if (clubList) {
    clubList.addEventListener('click', (event) => {
      const li = event.target.closest('li');
      if (li) {
        const name = li.dataset.name || '';
        const location = li.dataset.location || '';
        const league = li.dataset.league || '';
        const ageGroup = li.dataset.ageGroup || '';
        const logo = li.dataset.logo || '';
        const stadium = li.dataset.stadium || '';
        const website = li.dataset.website || '';
        const socialLink = li.dataset.socialLink || '';

        if (modalBody) {
          modalBody.innerHTML = `
            <h2>${name}</h2>
            <div style="display: flex; gap: 20px; align-items: flex-start; margin-top: 10px;">
              ${logo ? `<img src="${logo}" alt="${name} logo" class="modal-logo">` : ''}
              <div>
                <p><strong>League:</strong> ${league}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Stadium:</strong> ${stadium}</p>
                <p><strong>Website:</strong> ${website ? `<a href="${website}" target="_blank" rel="noopener">${name}</a>` : ''}</p>
                <p><strong>Instagram:</strong> ${socialLink ? `<a href="${socialLink}" target="_blank" rel="noopener"><img src="images/insta-logo.png" alt="Instagram" class="social-logo"></a>` : ''}</p>
                <p><strong>Age Group:</strong> ${ageGroup}</p>
              </div>
            </div>
          `;
        }

        modal && (modal.style.display = 'block');
      }
    });
  }

  modalClose && (modalClose.onclick = () => { modal && (modal.style.display = 'none'); });

  window.onclick = (event) => {
    if (event.target === modal) {
      modal && (modal.style.display = 'none');
    }
  };
});