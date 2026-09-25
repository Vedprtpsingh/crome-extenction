(() => {
  // DOM elements
  const sectionsList = document.getElementById('sections-list');
  const addSectionBtn = document.getElementById('add-section-btn');
  const linksList = document.getElementById('links-list');
  const addLinkBtn = document.getElementById('add-link-btn');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const filterSelect = document.getElementById('filter-select');

  const linkModal = document.getElementById('link-modal');
  const modalTitle = document.getElementById('modal-title');
  const linkForm = document.getElementById('link-form');
  const linkTitleInput = document.getElementById('link-title');
  const linkUrlInput = document.getElementById('link-url');
  const linkSectionSelect = document.getElementById('link-section');
  const cancelBtn = document.getElementById('cancel-btn');

  const sectionModal = document.getElementById('section-modal');
  const sectionForm = document.getElementById('section-form');
  const sectionNameInput = document.getElementById('section-name');
  const sectionCancelBtn = document.getElementById('section-cancel-btn');

  // State
  let sections = [];
  let selectedSectionId = null;
  let editingLinkId = null;

  // Utility functions
  function saveSections() {
    chrome.storage.local.set({ sections });
  }

  function loadSections(callback) {
    chrome.storage.local.get({ sections: [] }, (data) => {
      sections = data.sections;
      if (sections.length === 0) {
        // Initialize with a default section
        const defaultSection = {
          id: Date.now().toString(),
          name: 'Default',
          links: []
        };
        sections.push(defaultSection);
      }
      if (!selectedSectionId || !sections.find(s => s.id === selectedSectionId)) {
        selectedSectionId = sections[0].id;
      }
      callback();
    });
  }

  function formatTimestamp(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString();
  }

  // Render functions
  let sectionEditMode = false;
  let editingSectionId = null;

  function renderSections() {
    sectionsList.innerHTML = '';
    sections.forEach(section => {
      const li = document.createElement('li');
      li.dataset.id = section.id;
      if (section.id === selectedSectionId) {
        li.classList.add('active');
      }

      const nameSpan = document.createElement('span');
      nameSpan.textContent = section.name;
      nameSpan.style.cursor = 'pointer';
      nameSpan.addEventListener('click', () => {
        selectedSectionId = section.id;
        renderSections();
        renderLinks();
      });

      const editBtn = document.createElement('button');
      editBtn.title = 'Edit Section';
      editBtn.textContent = '✏️';
      editBtn.className = 'section-edit-btn';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditSectionModal(section.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.title = 'Delete Section';
      deleteBtn.textContent = '🗑️';
      deleteBtn.className = 'section-delete-btn';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSection(section.id);
      });

      li.appendChild(nameSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      sectionsList.appendChild(li);
    });
  }

  function openEditSectionModal(sectionId) {
    sectionEditMode = true;
    editingSectionId = sectionId;
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    sectionNameInput.value = section.name;
    sectionModal.querySelector('h3').textContent = 'Edit Section';
    sectionModal.classList.remove('hidden');
    sectionNameInput.focus();
  }

  function closeSectionModal() {
    sectionModal.classList.add('hidden');
    sectionEditMode = false;
    editingSectionId = null;
  }

  function saveSection(name) {
    if (!name.trim()) return;
    const exists = sections.some(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== editingSectionId);
    if (exists) {
      alert('Section with this name already exists.');
      return false;
    }
    if (sectionEditMode) {
      // Edit existing section
      const section = sections.find(s => s.id === editingSectionId);
      if (section) {
        section.name = name.trim();
      }
    } else {
      // Add new section
      const newSection = {
        id: Date.now().toString(),
        name: name.trim(),
        links: []
      };
      sections.push(newSection);
      selectedSectionId = newSection.id;
    }
    saveSections();
    renderSections();
    renderLinks();
    closeSectionModal();
    return true;
  }

  function deleteSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    if (confirm(`Are you sure you want to delete the section "${section.name}"? This will also delete all links in this section.`)) {
      const index = sections.findIndex(s => s.id === sectionId);
      if (index !== -1) {
        sections.splice(index, 1);
        if (selectedSectionId === sectionId) {
          selectedSectionId = sections.length > 0 ? sections[0].id : null;
        }
        saveSections();
        renderSections();
        renderLinks();
      }
    }
  }

  sectionCancelBtn.addEventListener('click', closeSectionModal);
  sectionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSection(sectionNameInput.value);
  });

  function renderLinks() {
    linksList.innerHTML = '';
    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) return;

    let filteredLinks = section.links;

    // Filter by search
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
      filteredLinks = filteredLinks.filter(link =>
        link.title.toLowerCase().includes(searchTerm) ||
        link.url.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by visited status
    const filterValue = filterSelect.value;
    if (filterValue === 'visited') {
      filteredLinks = filteredLinks.filter(link => link.visited);
    } else if (filterValue === 'not-visited') {
      filteredLinks = filteredLinks.filter(link => !link.visited);
    }

    // Sort links
    const sortValue = sortSelect.value;
    filteredLinks = filteredLinks.slice(); // clone array
    if (sortValue === 'name-asc') {
      filteredLinks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === 'name-desc') {
      filteredLinks.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortValue === 'time-newest') {
      filteredLinks.sort((a, b) => b.addedTimestamp - a.addedTimestamp);
    } else if (sortValue === 'time-oldest') {
      filteredLinks.sort((a, b) => a.addedTimestamp - b.addedTimestamp);
    }

    filteredLinks.forEach(link => {
      const li = document.createElement('li');

      const linkInfo = document.createElement('div');
      linkInfo.className = 'link-info';

      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.title;
      a.className = 'link-title';
      if (link.visited) {
        a.classList.add('visited');
      }
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const urlSpan = document.createElement('span');
      urlSpan.className = 'link-url';
      urlSpan.textContent = link.url;

      const timestampSpan = document.createElement('span');
      timestampSpan.className = 'link-timestamp';
      if (link.visited) {
        timestampSpan.textContent = 'Visited: ' + formatTimestamp(link.visitedTimestamp);
      } else {
        timestampSpan.textContent = 'Not Visited';
      }

      linkInfo.appendChild(a);
      linkInfo.appendChild(urlSpan);
      linkInfo.appendChild(timestampSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'link-actions';

      const editBtn = document.createElement('button');
      editBtn.title = 'Edit Link';
      editBtn.innerHTML = '✏️';
      editBtn.addEventListener('click', () => openEditLinkModal(link.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.title = 'Delete Link';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.addEventListener('click', () => deleteLink(link.id));

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(linkInfo);
      li.appendChild(actionsDiv);

      linksList.appendChild(li);
    });
  }

  // Section management
  function openAddSectionModal() {
    sectionNameInput.value = '';
    sectionModal.classList.remove('hidden');
    sectionNameInput.focus();
  }

  function closeSectionModal() {
    sectionModal.classList.add('hidden');
  }

  function addSection(name) {
    if (!name.trim()) return;
    const exists = sections.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert('Section with this name already exists.');
      return;
    }
    const newSection = {
      id: Date.now().toString(),
      name: name.trim(),
      links: []
    };
    sections.push(newSection);
    selectedSectionId = newSection.id;
    saveSections();
    renderSections();
    renderLinks();
  }

  // Link management
  function openAddLinkModal() {
    editingLinkId = null;
    modalTitle.textContent = 'Add Link';
    linkTitleInput.value = '';
    linkUrlInput.value = '';
    populateLinkSectionOptions();
    linkModal.classList.remove('hidden');
    linkTitleInput.focus();
  }

  function openEditLinkModal(linkId) {
    editingLinkId = linkId;
    modalTitle.textContent = 'Edit Link';
    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) return;
    const link = section.links.find(l => l.id === linkId);
    if (!link) return;
    linkTitleInput.value = link.title;
    linkUrlInput.value = link.url;
    populateLinkSectionOptions(link.sectionId || selectedSectionId);
    linkModal.classList.remove('hidden');
    linkTitleInput.focus();
  }

  function closeLinkModal() {
    linkModal.classList.add('hidden');
  }

  function populateLinkSectionOptions(selectedId) {
    linkSectionSelect.innerHTML = '';
    sections.forEach(section => {
      const option = document.createElement('option');
      option.value = section.id;
      option.textContent = section.name;
      if (section.id === selectedId) {
        option.selected = true;
      }
      linkSectionSelect.appendChild(option);
    });
  }

  function saveLink(title, url, sectionId) {
    if (!title.trim() || !url.trim()) return;
    // Validate URL
    try {
      new URL(url);
    } catch {
      alert('Please enter a valid URL.');
      return;
    }

    // Remove from old section if editing and section changed
    if (editingLinkId) {
      let oldSection = sections.find(s => s.links.some(l => l.id === editingLinkId));
      if (oldSection) {
        const linkIndex = oldSection.links.findIndex(l => l.id === editingLinkId);
        if (linkIndex !== -1) {
          const link = oldSection.links[linkIndex];
          if (oldSection.id !== sectionId) {
            oldSection.links.splice(linkIndex, 1);
            // Add to new section
            const newSection = sections.find(s => s.id === sectionId);
            if (newSection) {
              newSection.links.push({
                id: editingLinkId,
                title: title.trim(),
                url: url.trim(),
                visited: link.visited,
                visitedTimestamp: link.visitedTimestamp,
                addedTimestamp: link.addedTimestamp
              });
            }
          } else {
            // Update in same section
            link.title = title.trim();
            link.url = url.trim();
          }
          saveSections();
          renderLinks();
          closeLinkModal();
          return;
        }
      }
    }

    // Add new link
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    // Check for duplicate URL in section
    const exists = section.links.some(l => l.url === url.trim());
    if (exists) {
      alert('This link already exists in the selected section.');
      return;
    }
    section.links.push({
      id: Date.now().toString(),
      title: title.trim(),
      url: url.trim(),
      visited: false,
      visitedTimestamp: null,
      addedTimestamp: Date.now()
    });
    saveSections();
    renderLinks();
    closeLinkModal();
  }

  function deleteLink(linkId) {
    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) return;
    const index = section.links.findIndex(l => l.id === linkId);
    if (index !== -1) {
      if (confirm('Are you sure you want to delete this link?')) {
        section.links.splice(index, 1);
        saveSections();
        renderLinks();
      }
    }
  }

  // Event listeners
  addSectionBtn.addEventListener('click', openAddSectionModal);
  sectionCancelBtn.addEventListener('click', closeSectionModal);
  sectionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addSection(sectionNameInput.value);
    closeSectionModal();
  });

  addLinkBtn.addEventListener('click', openAddLinkModal);
  cancelBtn.addEventListener('click', closeLinkModal);
  linkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveLink(linkTitleInput.value, linkUrlInput.value, linkSectionSelect.value);
  });

  searchInput.addEventListener('input', renderLinks);
  sortSelect.addEventListener('change', renderLinks);
  filterSelect.addEventListener('change', renderLinks);

  // Initial load
  loadSections(() => {
    renderSections();
    renderLinks();
  });
})();
