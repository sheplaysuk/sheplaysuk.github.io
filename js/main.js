document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const clubList = document.getElementById('clubResults');
  const leagueFilter = document.getElementById('leagueFilter');
  const locationFilter = document.getElementById('locationFilter');
  const ageGroupFilter = document.getElementById('ageGroupFilter');
  const searchForm = document.getElementById('searchForm');
  const filterBtn = document.getElementById('filterSearchBtn');

  const panel = document.getElementById('clubPanel');
  const panelBody = document.getElementById('panelBody');
  const panelClose = document.getElementById('panelClose');

  // Data store
  let allClubs = [];

  // Pagination
  let currentPage = 1;
  const pageSize = 20;
  let lastClubsFiltered = [];

  fetch('data/football/clubs.json')
      .then(res => res.json())
      .then(data => {
        allClubs = data || [];

        populateFilters(allClubs);

        lastClubsFiltered = allClubs.slice();
        renderClubs(lastClubsFiltered);
      })
      .catch(err => console.error('Error loading clubs.json', err));

  function populateFilters(clubs) {
    const leagues = [...new Set(clubs.map(c => c.league).filter(Boolean))];
    const locations = [...new Set(clubs.map(c => c.location).filter(Boolean))];
    const ageGroups = [...new Set(clubs.map(c => c.age_group).filter(Boolean))];

    fillSelect(leagueFilter, leagues, 'All Leagues');
    fillSelect(locationFilter, locations, 'All Locations');
    fillSelect(ageGroupFilter, ageGroups, 'All Age Groups');
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

  function filterClubs() {
    const league = leagueFilter.value || '';
    const location = locationFilter.value || '';
    const ageGroup = ageGroupFilter.value || '';
    const searchValue = (document.getElementById('search')?.value || '').trim().toLowerCase();

    const filtered = allClubs.filter(club => {
      const matchesSearch = !searchValue ||
          club.name.toLowerCase().includes(searchValue) ||
          club.location.toLowerCase().includes(searchValue);

      const matchesLeague = !league || club.league === league;
      const matchesLocation = !location || club.location === location;
      const matchesAgeGroup = !ageGroup || club.age_group === ageGroup;

      return (
          matchesSearch &&
          matchesLeague &&
          matchesLocation &&
          matchesAgeGroup
      );
    });

    lastClubsFiltered = filtered;
    currentPage = 1;
    renderClubs(filtered);
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', filterClubs);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      filterClubs();
    });
  }

  function renderClubs(clubs) {
    if (!clubList) return;
    clubList.innerHTML = '';

    const totalPages = Math.max(1, Math.ceil(clubs.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const clubsToShow = clubs.slice(start, end);

    if (clubsToShow.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No clubs found.';
      clubList.appendChild(li);
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
                <div style="display:flex; align-items:center; gap:16px;">
                    ${club.logo ? `<img src="${club.logo}" alt="${club.name} logo" class="club-logo">` : ''}
                    <div style="flex:1;">
                        <strong>${club.name}</strong><br/>
                        <em>${club.league}</em><br/>
                        <span>${club.location}</span><br/>
                        <span class="age-badge" data-age-group="${club.age_group}">${club.age_group}</span>
                    </div> 
                </div>`;

        clubList.appendChild(li);
      });
    }
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

  if (clubList && panel && panelBody) {
    clubList.addEventListener('click', event => {
      const li = event.target.closest('li');
      if (!li) return;

      const name = li.dataset.name;
      const location = li.dataset.location;
      const league = li.dataset.league;
      const ageGroup = li.dataset.ageGroup;
      const logo = li.dataset.logo;
      const stadium = li.dataset.stadium;
      const website = li.dataset.website;
      const socialLink = li.dataset.socialLink;

      panelBody.innerHTML = `
            <h2>${name}</h2>
            
            ${logo ? `<img src="${logo}" alt="${name}" class="panel-logo">`: ''}
            
            <p><strong>League:</strong> ${league}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Stadium:</strong> ${stadium || 'Not available'}</p>
            
            <p><strong>Website:</strong>
            ${website ? `<a href="${website}" target="_blank">${name}</a>` : 'Not Available'}
            </p>
            
            <p><strong>Instagram:</strong>
            ${socialLink ? `<a href="${socialLink}" target="_blank">Visit</a>` : 'Not available'}
            </p>
            
            <p><strong>Age Group: </strong><span class="age-badge" data-age-group="${ageGroup}">${ageGroup}</span></p>
            `;
      panel.classList.add('open');
    });
  }

  if (panelClose && panel) {
    panelClose.addEventListener('click', () => {
      panel.classList.remove('open');
    });
  }

});
