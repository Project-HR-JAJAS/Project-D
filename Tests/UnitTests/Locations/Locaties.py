from unittest.mock import patch, MagicMock
from backend.fraud_locations.Fraude_Locaties import FraudLocationManager

# Test: Location is not left as None after geocoding
def test_geocode_address_returns_coords():
    manager = FraudLocationManager(':memory:')
    with patch.object(manager, 'geolocator') as mock_geolocator:
        mock_location = MagicMock()
        mock_location.latitude = 52.0
        mock_location.longitude = 4.0
        mock_geolocator.geocode.return_value = mock_location
        coords = manager.geocode_address('Teststraat 1', '1234AB', 'Den Haag', 'NLD')
        assert coords is not None
        assert coords['latitude'] == 52.0
        assert coords['longitude'] == 4.0

# Test: Missing fields are handled gracefully
def test_geocode_address_missing_fields():
    manager = FraudLocationManager(':memory:')
    with patch.object(manager, 'geolocator') as mock_geolocator:
        mock_geolocator.geocode.return_value = None
        # Missing address
        coords = manager.geocode_address('', '1234AB', 'Den Haag', 'NLD')
        assert coords is None
        # Missing zip
        coords = manager.geocode_address('Teststraat 1', '', 'Den Haag', 'NLD')
        assert coords is None
        # Missing city
        coords = manager.geocode_address('Teststraat 1', '1234AB', '', 'NLD')
        assert coords is None
        # Missing country
        coords = manager.geocode_address('Teststraat 1', '1234AB', 'Den Haag', '')
        assert coords is None

# Test: geocode is called with the correct formatted address
def test_geocode_address_calls_geolocator_with_correct_address():
    manager = FraudLocationManager(':memory:')
    with patch.object(manager, 'geolocator') as mock_geolocator:
        mock_location = MagicMock()
        mock_location.latitude = 52.0
        mock_location.longitude = 4.0
        mock_geolocator.geocode.return_value = mock_location
        address = 'Teststraat 1'
        zip_code = '1234AB'
        city = 'Den Haag'
        country = 'NLD'
        # Use the same formatting as the production code
        cleaned_address = manager.clean_address(address, zip_code, city)
        expected_query = manager.format_address(cleaned_address, zip_code, city, country)
        manager.geocode_address(address, zip_code, city, country)
        mock_geolocator.geocode.assert_called_with(expected_query)

# Test: Non-string input is handled gracefully
def test_geocode_address_non_string_input():
    manager = FraudLocationManager(':memory:')
    with patch.object(manager, 'geolocator') as mock_geolocator:
        mock_geolocator.geocode.return_value = None
        coords = manager.geocode_address(123, '1234AB', 'Den Haag', 'NLD')
        assert coords is None
        coords = manager.geocode_address('Teststraat 1', None, 'Den Haag', 'NLD')
        assert coords is None
        coords = manager.geocode_address('Teststraat 1', '1234AB', [], 'NLD')
        assert coords is None

# Test: Whitespace fields are treated as missing
def test_geocode_address_whitespace_fields():
    manager = FraudLocationManager(':memory:')
    with patch.object(manager, 'geolocator') as mock_geolocator:
        mock_geolocator.geocode.return_value = None
        coords = manager.geocode_address('   ', '1234AB', 'Den Haag', 'NLD')
        assert coords is None
        coords = manager.geocode_address('Teststraat 1', '   ', 'Den Haag', 'NLD')
        assert coords is None
        coords = manager.geocode_address('Teststraat 1', '1234AB', '   ', 'NLD')
        assert coords is None
        coords = manager.geocode_address('Teststraat 1', '1234AB', 'Den Haag', '   ')
        assert coords is None

# Test: geolocator.geocode raises exception
def test_geocode_address_geolocator_exception():
    manager = FraudLocationManager(':memory:')
    with patch.object(manager, 'geolocator') as mock_geolocator:
        mock_geolocator.geocode.side_effect = Exception('Geocode error')
        coords = manager.geocode_address('Teststraat 1', '1234AB', 'Den Haag', 'NLD')
        assert coords is None
