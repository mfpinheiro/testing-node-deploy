import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
	return stores
		.map(store => {
			return `
                <a href="/store/${store.slug}" class="search__result">
                    <strong>${store.name}</strong>
                </a>
            `;
		})
		.join('');
}

function typeAhead(search) {
	if (!search) return;

	// get the selectors
	const searchInput = search.querySelector('input[name="search"]');
	const searchResults = search.querySelector('.search__results');

	// perform the search
	searchInput.on('input', function() {
		if (!this.value) {
			searchResults.style.display = 'none'; // clean
			return; // stop
		}

		// Show the results
		searchResults.style.display = 'block';
		// Remove if nothing is find
		searchResults.innerHTML = '';

		axios
			.get(`/api/search?q=${this.value}`)
			.then(res => {
				if (res.data.length) {
					// Append
					searchResults.innerHTML = dompurify.sanitize(
						searchResultsHTML(res.data)
					);
					return;
				}
				// tell them nothing came back
				searchResults.innerHTML = dompurify.sanitize(
					`<div class="search__result">No results for <strong>${
						this.value
					}</strong> Found!</div>`
				);
			})
			.catch(err => {
				console.error(err);
			});
	});

	// dandle keyboard inputs
	searchInput.on('keyup', e => {
		// if they aren't pressing up, down or enter, who cares!
		if (![38, 40, 13].includes(e.keyCode)) {
			return; // Skiiiiiiiiip
		}

		/**
		 * Create the effect to enter the list.
		 */

		const activeClass = 'search__result--active';
		const current = search.querySelector(`.${activeClass}`);
		const items = search.querySelectorAll('.search__result');
		let next;

		if (e.keyCode === 40 && current) {
			next = current.nextElementSibling || items[0];
		} else if (e.keyCode === 40) {
			next = items[0];
		} else if (e.keyCode === 38 && current) {
			next = current.previousElementSibling || items[items.length - 1];
		} else if (e.keyCode === 38) {
			next = items[items.length - 1];
		} else if (e.keyCode === 13 && current.href) {
			window.location = current.href;
			return;
		}
		if (current) {
			current.classList.remove(activeClass);
		}
		next.classList.add(activeClass);
	});
}

export default typeAhead;
