document.addEventListener('DOMContentLoaded', () => {
  const clubList = document.getElementById('clubResults');

  let allClubs = [];
  let allLeagues = [];
  let allLocations = [];
  let allAgeGroups = [];
  let allSports = [];

  // Pagination variables
  let currentPage = 1;
  const pageSize = 20;
  let lastClubsFiltered = [];

  // Fetch and store all data
  fetch('data/leagues.json')
    .then(response => response.json())
    .then(leagues => {
      allLeagues = leagues.map(l => l.name);
      populateLeagueFilter(allLeagues);
    });

  fetch('data/locations.json')
    .then(response => response.json())
    .then(locations => {
      allLocations = locations;
      populateLocationFilter(allLocations);
    });

  fetch('data/clubs.json')
    .then(response => response.json())
    .then(clubs => {
      allClubs = clubs;
      allAgeGroups = [...new Set(clubs.map(club => club.age_group).filter(Boolean))];
      populateAgeGroupFilter(allAgeGroups);
      lastClubsFiltered = clubs;
      renderClubs(clubs);
    });

  fetch('data/sports.json')
    .then(response => response.json())
    .then(sports => {
      allSports = sports.map(s => s.name);
      const sportsTabs = document.getElementById('sportTabs');
      if (sportsTabs) {
        sportsTabs.innerHTML = '';

        sports.forEach(sport => {
          const tab = document.createElement('button');
          tab.className = 'sport-tab';
          tab.textContent = sport.name;
          tab.dataset.sport = sport.name;
          sportsTabs.appendChild(tab);
        });

      let defaultTab = Array.from(sportsTabs.children).find(tab => tab.dataset.sport === "Football");
      if (defaultTab) {
        defaultTab.classList.add('active');
        updateFiltersForSport("Football");
        filterAndRenderClubs("Football");
      } else {
        // Fallback to "All Sports" if Football not found
        allTab.classList.add('active');
        updateFiltersForSport('');
        filterAndRenderClubs('');
      }

        // Tab click event
        sportsTabs.addEventListener('click', (e) => {
          if (e.target.classList.contains('sport-tab')) {
            document.querySelectorAll('.sport-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            const selectedSport = e.target.dataset.sport;
            updateFiltersForSport(selectedSport);
            currentPage = 1;
            filterAndRenderClubs(selectedSport);
          }
        });
      }
    });

  // Helper functions to populate filters
  function populateLeagueFilter(leagues) {
    const leagueFilter = document.getElementById('leagueFilter');
    leagueFilter.innerHTML = '<option value="">All Leagues</option>';
    leagues.forEach(league => {
      const option = document.createElement('option');
      option.value = league;
      option.textContent = league;
      leagueFilter.appendChild(option);
    });
  }

  function populateLocationFilter(locations) {
    const locationFilter = document.getElementById('locationFilter');
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
  }

  function populateAgeGroupFilter(ageGroups) {
    const ageGroupFilter = document.getElementById('ageGroupFilter');
    ageGroupFilter.innerHTML = '<option value="">All Age Groups</option>';
    ageGroups.forEach(ageGroup => {
      const option = document.createElement('option');
      option.value = ageGroup;
      option.textContent = ageGroup;
      ageGroupFilter.appendChild(option);
    });
  }

  // Update filters when a sport is selected
  function updateFiltersForSport(selectedSport) {
    let filteredClubs = allClubs;
    if (selectedSport) {
      filteredClubs = allClubs.filter(club => club.sport === selectedSport);
    }
    // Get unique leagues, locations, and age groups for the selected sport
    const leagues = [...new Set(filteredClubs.map(club => club.league).filter(Boolean))];
    const locations = [...new Set(filteredClubs.map(club => club.location).filter(Boolean))];
    const ageGroups = [...new Set(filteredClubs.map(club => club.age_group).filter(Boolean))];

    populateLeagueFilter(leagues);
    populateLocationFilter(locations);
    populateAgeGroupFilter(ageGroups);
  }

  function filterAndRenderClubs(selectedSport = '') {
    const league = document.getElementById('leagueFilter').value;
    const location = document.getElementById('locationFilter').value;
    const ageGroup = document.getElementById('ageGroupFilter').value;

    const filtered = allClubs.filter(club => {
      return (!selectedSport || club.sport === selectedSport) &&
             (!league || club.league === league) &&
             (!location || club.location === location) &&
             (!ageGroup || club.age_group === ageGroup);
    });

    lastClubsFiltered = filtered;
    currentPage = 1;
    renderClubs(filtered);
  }

  // Update filter button to use filterAndRenderClubs
  document.getElementById('filterSearchBtn').addEventListener('click', () => {
    const activeTab = document.querySelector('.sport-tab.active');
    const selectedSport = activeTab ? activeTab.dataset.sport : '';
    filterAndRenderClubs(selectedSport);
  });

  // Listen for search form submit (searches by club name or location)
  document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const searchValue = document.getElementById('search').value.trim().toLowerCase();
    const activeTab = document.querySelector('.sport-tab.active');
    const selectedSport = activeTab ? activeTab.dataset.sport : '';
    const league = document.getElementById('leagueFilter').value;
    const location = document.getElementById('locationFilter').value;
    const ageGroup = document.getElementById('ageGroupFilter').value;

    const filtered = allClubs.filter(club => {
      const matchesSearch =
        club.name.toLowerCase().includes(searchValue) ||
        club.location.toLowerCase().includes(searchValue);
      const matchesSport = !selectedSport || club.sport === selectedSport;
      const matchesLeague = !league || club.league === league;
      const matchesLocation = !location || club.location === location;
      const matchesAgeGroup = !ageGroup || club.age_group === ageGroup;
      return matchesSearch && matchesSport && matchesLeague && matchesLocation && matchesAgeGroup;
    });

    lastClubsFiltered = filtered;
    currentPage = 1;
    renderClubs(filtered);
  });

  // Function to render clubs with pagination
  function renderClubs(clubs) {
    const clubList = document.getElementById('clubResults');
    clubList.innerHTML = '';

    // Pagination logic
    const totalPages = Math.ceil(clubs.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const clubsToShow = clubs.slice(start, end);

    clubsToShow.forEach(club => {
      const li = document.createElement('li');
      li.dataset.name = club.name;
      li.dataset.location = club.location;
      li.dataset.league = club.league;
      li.dataset.ageGroup = club.age_group;
      li.dataset.logo = club.logo;
      li.dataset.address = club.address;
      li.dataset.email = club.email;
      li.dataset.socialLink = club.social_link;

      li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
          ${club.logo ? `<img src="${club.logo}" alt="${club.name} logo" class="club-logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 6px;">` : ''}
          <div style="flex:1;">
            <strong>${club.name}</strong><br/>
            <em>${club.league}</em><br/>
            ${club.location}<br/>
            ${club.age_group}
          </div>
        </div>
      `;
      clubList.appendChild(li);
    });

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
      clubList.parentNode.appendChild(pagination);
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

  // Modal functionality
  const modal = document.getElementById('clubModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  clubList.addEventListener('click', (event) => {
    const li = event.target.closest('li');
    if (li) {
      const name = li.dataset.name || '';
      const location = li.dataset.location || '';
      const league = li.dataset.league || '';
      const ageGroup = li.dataset.ageGroup || '';
      const logo = li.dataset.logo || '';
      const address = li.dataset.address || '';
      const email = li.dataset.email || '';
      const socialLink = li.dataset.socialLink || '';

      modalBody.innerHTML = `
        <h2>${name}</h2>
        <div style="display: flex; gap: 20px; align-items: flex-start; margin-top: 10px;">
          ${logo ? `<img src="${logo}" alt="${name} logo" style="width: 190px; height: auto; border-radius: 6px;">` : ''}
          <div>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>League:</strong> ${league}</p>
            <p><strong>Age Group:</strong> ${ageGroup}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Email Address:</strong> ${email}</p>
            <p><strong>Instagram:</strong> <a href="${socialLink}">${name}</a></p>
          </div>
        </div>
      `;

      modal.style.display = 'block';
    }
  });

  modalClose.onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
});