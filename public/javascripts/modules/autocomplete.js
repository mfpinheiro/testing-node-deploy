function autocomplete(input, latInput, lgnInput) {
    if(!input) return;
    const dropdown = new google.maps.places.Autocomplete(input);

    dropdown.addListener('place_changed', () => {
        const place = dropdown.getPlace();
        latInput.value = place.geometry.location.lat();
        lgnInput.value = place.geometry.location.lng();
    });

    //if someone hits enter on the address field
    input.on('keydonw', (e) => {
        if(e.keyCode === 13) e.preventDefault();
    });
}

export default autocomplete;