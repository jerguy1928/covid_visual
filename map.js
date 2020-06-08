//create map
	var map = L.map('map').setView([40, -15], 2);
	map.zoomControl.setPosition('bottomleft');

//create basemap
	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox/light-v9',
		tileSize: 512,
		zoomOffset: -1
	}).addTo(map);


//add info button
	var msg = 'This app shows COVID-19 data from Worldometers.\n' 
			+ 'Click on the dropdown to get a map of various COVID-19 statistics. Data is updated every 30 minutes.\n'
			+ 'DISCLAIMER: This visualization is purely for illustrative purposes only. Data/land borders may be inaccurate.'
	info_btn = L.easyButton('<span style="font-family:baskerville"><b><i>i</i></b></span>', 
		function(){alert(msg);}).addTo(map);

	info_btn.setPosition('bottomleft');

// add search button
	var options = {url: "https://api.geocode.earth/v1"};
	search_btn = L.control.geocoder({position:'bottomleft'},'ge-6071d21825e9421c',options);
	search_btn.addTo(map);

// control that shows state info on hover
	var info = L.control();

// adds info panel to map
	info.onAdd = function (map) {
	this._div = L.DomUtil.create('div', 'info');
	this.update();
	return this._div;
};

// determines scale for each field of data (e.g. total cases, new cases, etc.)
	function get_grades(field){
		return  field == "rank" 	       ? [200,150,100,50,25,10,1]:
				field == "total_cases"     ? [1000000,100000,50000,10000,1000,100,10]:
				field == "new_cases"       ? [10000,1000,500,100,50,20,1]:
				field == "total_deaths"    ? [50000,10000,5000,1000,100,50,1]:
				field == "new_deaths"      ? [1000,500,100,50,25,10,1]:
				field == "total_recovered" ? [0.99,0.75,0.55,0.35,0.25,0.15,0.01]:
				field == "new_recovered"   ? [1000,100,50,25,10,5,1]:
				field == "active_cases"    ? [1000000,100000,10000,1000,100,50,1]:
				field == "critical_cases"  ? [10000,5000,1000,500,100,50,1]:
				field == "cases_1m"        ? [10000,1000,500,100,50,25,1]:
				field == "deaths_1m"       ? [1000,500,100,50,25,10,1]:
				field == "total_tests"     ? [10000000,1000000,100000,10000,1000,100,10]:
				field == "tests_1m"        ? [100000,50000,10000,5000,1000,100,10]:
				field == "population"      ? [1000000000,100000000,10000000,1000000,100000,10000,1000]:
				field == "cases_x_ppl"     ? [500000,100000,10000,1000,500,100,1]:
				field == "deaths_x_ppl"    ? [1000000,100000,10000,1000,100,1]:
				field == "tests_x_ppl"     ? [100000,10000,1000,500,100,50,1]:
											"ERROR";
}

//chooses appropriate color ramp for map based on field
	function color_ramp(field){
		var rank_colors = 	    ['#FFEDA0','#FED976','#FEB24C', '#FD8D3C', '#FC4E2A',
								'#E31A1C','#800026','#005a32','#005a32','#525252','#005a32'];
		
		var recovered_colors =  ['#005a32','#1a9850','#91cf60','#d9ef8b','#fee08b',
								'#fdae61','#fc8d59','#d73027', '#BD0026','#99000d',
								'#525252','#1a9850','#525252','#99000d'];

		var positive_colors =	['#005a32','#238b45','#41ab5d','#74c476','#a1d99b',
								'#c7e9c0','#f7fcf5','#005a32','#005a32','#525252',
								'#99000d'];

		var tests_ppl_colors =  ['#f7fcf5','#c7e9c0','#a1d99b','#74c476','#41ab5d',
								'#238b45','#005a32','#005a32','#005a32','#525252','#99000d'];

		var new_recovered_colors = ['#005a32','#238b45','#41ab5d','#74c476','#a1d99b',
									'#c7e9c0','#f7fcf5','#99000d','#525252','#525252',
									'#525252','#525252','#99000d'];

		var population_colors = ['#252525','#525252','#737373','#969696',
								'#bdbdbd','#d9d9d9','#f0f0f0','#fff'];


		var negative_colors =   ['#800026','#BD0026','#E31A1C','#FD8D3C',
								'#FEB24C','#FED976','#FFEDA0','#005a32',
								'#005a32','#005a32','#525252','#005a32'];
		
		return  field == "rank" 	       ? rank_colors:
				field == "total_recovered" ? recovered_colors:		
				field == "new_recovered"   ? new_recovered_colors:		
				field == "total_tests"     ? positive_colors:
				field == "tests_1m"        ? positive_colors:
				field == "cases_x_ppl"	   ? rank_colors:
				field == "deaths_x_ppl"    ? rank_colors:
				field == "tests_x_ppl"     ? tests_ppl_colors:
				field == "population"      ? population_colors: 
											 negative_colors;
}

// sets hover information and style information based on field
	function get_fields(props){

		var hover_text;
		var hover_val;
		var style_val;

		switch(document.getElementById('numbers').value){
			case "rank":
				hover_text = 'Rank #';
				hover_val = props.rank;
				if (hover_val == undefined){
					hover_text = 'No Rank ';
					hover_val = '(No reported cases)';
				}
				grade = get_grades("rank");
				style_val = color_assign(props.rank,grade,color_ramp("rank"));
				break;

			case "total_cases":
				hover_text = 'Total Cases: ';
				hover_val = props.total_cases;
				if (hover_val== undefined){
					hover_val = '(No reported cases)'
				}
				grade = get_grades("total_cases");
				style_val = color_assign(props.total_cases,grade,color_ramp("total_cases"));
				break;

			case "new_cases":
				hover_text = 'New Cases: ';
				hover_val = props.new_cases;
				if (hover_val == 'NULL'){
					hover_val = 0
				} else if (hover_val == undefined){
					hover_val = "(No reported cases)"
				}
				grade = get_grades("new_cases");
				style_val = color_assign(props.new_cases,grade,color_ramp("new_cases"));

				break;
			case "total_deaths":
				hover_text = 'Total Deaths: ';
				hover_val = props.total_deaths;
				if (hover_val == 'NULL'){
					hover_val = 0
				} else if (hover_val== undefined){
					hover_val = '(No reported deaths)'
				}
				grade = get_grades("total_deaths");
				style_val = color_assign(props.total_deaths,grade,color_ramp("total_deaths"));

				break;
			case "new_deaths":
				hover_text = 'New Deaths: ';
				hover_val = props.new_deaths;
				hover_num = props.new_deaths;
				if (hover_val == 'NULL'){
					hover_val = "Unknown"
					hover_num = 'N/A';
				} else if (hover_val== undefined){
					hover_val = '(No reported deaths)'
				}
				grade = get_grades("new_deaths");
				style_val = color_assign(hover_num,grade,color_ramp("new_deaths"));
				break;

			case "total_recovered":
				hover_text = 'Total Recovered: ';
				hover_val = props.total_recovered;
				var recovery_val = '';
				if (hover_val == 'N/A' | hover_val == 'NULL'){
					hover_val = 'Unknown'
					recovery_val = "N/A";
				} else if (hover_val== undefined){
					recovery_val = 100;
					hover_val = '(No reported cases so no recoveries?)';
				} else if (hover_val== 'NULL'){
					recovery_val = 0;	
					hover_val =  "0/" + (props.total_cases).toLocaleString('en') + " (0%)";
				}
				else {
					hover_val = (props.total_recovered).toLocaleString('en') + "/" + 
					(props.total_cases).toLocaleString('en')  + 
					" (" + ((props.total_recovered/props.total_cases)* 100).toFixed(0) + "%)"

					recovery_val = props.total_recovered/props.total_cases;
				}
				grade = get_grades("total_recovered");
				style_val = color_assign((recovery_val),grade,color_ramp("total_recovered"));
				break;

			case "new_recovered":
				hover_text = 'New Recoveries: ';
				hover_val = props.new_recovered;
				var recovery_val = '';
				if (hover_val == 'N/A' | hover_val == "NULL"){
					hover_val = 'Unknown'
					recovery_val = "N/A";
				} 
				else if (hover_val== undefined){
					recovery_val = 1001;
					hover_val = '(No reported cases so no recoveries?)';
				} else {
					hover_val = (props.new_recovered).toLocaleString('en');
					recovery_val = props.new_recovered;
				}
				grade = get_grades("new_recovered");
				style_val = color_assign((recovery_val),grade,color_ramp("new_recovered"));
				break;


			case "active_cases":
				hover_text = 'Active Cases: ';
				hover_val = props.active_cases;
				hover_num = props.active_cases;
				if (hover_val == 'N/A'| hover_val == 'NULL'){
					hover_val = 'Unknown'
					hover_num = 'N/A';
				} else if (hover_val== undefined){
					hover_val = '(No reported cases)'
				}
				grade = get_grades("active_cases");
				style_val = color_assign(hover_num,grade,color_ramp("active_cases"));
				break;

			case "critical_cases":
				hover_text = 'Critical Cases: ';
				hover_val = props.critical_cases;
				hover_num = props.critical_cases;
				if (hover_val == 'NULL'){
					hover_val = 0;
					hover_num = 0;
				} else if (hover_val== undefined){
					hover_val = '(No reported cases)'
				}
				grade = get_grades("critical_cases");
				style_val = color_assign(hover_num,grade,color_ramp("critical_cases"));
				break;	

			case "cases_1m":
				hover_text = 'Cases per 1M people: ';
				hover_val = props.cases_1m;
				hover_num = props.cases_1m;
				if (hover_val == 'NULL'){
					hover_val = "No population data for " + props.name;
					hover_num = 'N/A';
				} else if (hover_val == undefined){
					hover_val = "(No reported cases)"
				}
				grade = get_grades("cases_1m");
				style_val = color_assign(hover_num,grade,color_ramp("cases_1m"));
				break;

			case "deaths_1m":
				hover_text = 'Deaths per 1M people: ';
				hover_val = props.deaths_1m;
				hover_num = props.deaths_1m;
				if (props.name == 'Diamond Princess' | props.name == 'MS Zaandam'){
					hover_val = "No population data for " + props.name;
					hover_num = 'N/A';
				} else if (hover_val == 'NULL' | hover_val == undefined){
					hover_val = "(No reported deaths)"
					hover_num = 0;
				}
				grade = get_grades("deaths_1m");
				style_val = color_assign(hover_num,grade,color_ramp("deaths_1m"));
				break;

			case "total_tests":
				hover_text = 'Total Tests: ';
				hover_val = props.total_tests;
				if (hover_val == undefined){
					hover_val = "(No reported cases so no tests?)"
				} else if (hover_val == 'NULL'){
					hover_val = "Unknown"
				}
				grade = get_grades("total_tests");
				style_val = color_assign(props.total_tests,grade,color_ramp("total_tests"));
				break;

			case "tests_1m":
				hover_text = 'Tests per 1M people: ';
				hover_val = props.tests_1m;
				if (hover_val == undefined){
					hover_val = "(No reported cases so no tests?)"
				} else if (hover_val == 'NULL'){
					hover_val = "Unknown # of tests/population"
				}
				grade = get_grades("tests_1m");
				style_val = color_assign(props.tests_1m,grade,color_ramp("tests_1m"));
				break;
		
			case "population":
				hover_text = 'Population: ';
				hover_val = props.population;
				if (props.name == 'Diamond Princess' | props.name == 'MS Zaandam'){
					hover_val = "No population data for " + props.name;
				}
				grade = get_grades("population");
				style_val = color_assign(props.population,grade,color_ramp("population"));
				break;

			case "cases_x_ppl":
				hover_text = '1 Case per: ';
				hover_val = props.cases_x_ppl;
				if (props.name == 'Diamond Princess' | props.name == 'MS Zaandam'){
					hover_text = '';
					hover_val = "No population data for " + props.name;
				} else if (hover_val == undefined){
					hover_text = '';
					hover_val = "No reported cases for " + props.name;
				}
				grade = get_grades("cases_x_ppl");
				style_val = color_assign(props.cases_x_ppl,grade,color_ramp("cases_x_ppl"));
				break;
			
			case "deaths_x_ppl":
				hover_text = '1 Death per: ';
				hover_val = props.deaths_x_ppl;
				hover_num = props.deaths_x_ppl;
				if (props.name == 'Diamond Princess' | props.name == 'MS Zaandam'){
					hover_text = '';
					hover_val = "No population data for " + props.name;
				} else if (hover_val == undefined | hover_val == 'NULL'){
					hover_text = '';
					hover_val = "No reported deaths for " + props.name;
					hover_num = 0;
				}
				grade = get_grades("deaths_x_ppl");
				style_val = color_assign(hover_num,grade,color_ramp("deaths_x_ppl"));
				break;	
			
			case "tests_x_ppl":
				hover_text = '1 Test per: ';
				hover_val = props.tests_x_ppl;
				if (props.name == 'Diamond Princess' | props.name == 'MS Zaandam'){
					hover_val = "No population data for " + props.name;
				} else if (hover_val == undefined){
					hover_text = '';
					hover_val = "(No reported cases so no tests?)";
				} else if (hover_val == 'NULL'){
					hover_text = '';
					hover_val = "Unknown # of tests";
				}
				grade = get_grades("tests_x_ppl");
				style_val = color_assign(props.tests_x_ppl,grade,color_ramp("tests_x_ppl"));
				break;

			default:
				hover_text = 'Rank #';
				hover_val = props.rank;
				grade = get_grades("rank");
				style_val = color_assign(props.rank,grade,color_ramp("rank"));
		}

		if(typeof(hover_val) == 'number'){hover_val = (hover_val).toLocaleString('en')}

		return [hover_text,hover_val,style_val];
}

// sets text for hover
	info.update = function (props) {
			this._div.innerHTML = '<h4>COVID-19 Map</h4>' +  (props ?
				'<b>' + props.name + '</b><br>' + get_fields(props)[0] + 
				get_fields(props)[1]:'Hover over a location');
};
	info.addTo(map);

// determines color information for map
function color_assign(d,x,c){
	return  d > x[0] ?    	c[0]:
			d > x[1] ?    	c[1]:
			d > x[2] ?    	c[2]:
			d > x[3] ?    	c[3]:
			d > x[4] ?    	c[4]:
			d > x[5] ?    	c[5]:
			d >= x[6] ?    	c[6]:
			d == 0 ? 		c[7]:
			d == undefined ? c[8]:
			d == 'NULL' ? 	c[9]:
			d == 'N/A' ?  	c[10]:
							c[11];
}

// sets color information for map
function style(feature) {
	return {
		weight: 2,
		opacity: 1,
		color: 'white',
		dashArray: '3',
		fillOpacity: 0.7,
		fillColor: get_fields(feature.properties)[2]
	};
}

// highlights feature hovered ipon
function highlightFeature(e) {
	var layer = e.target;

	layer.setStyle({
		weight: 5,
		color: '#666',
		dashArray: '',
		fillOpacity: 0.7
	});

	if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		layer.bringToFront();
	}

	info.update(layer.feature.properties);
}


// reset highlight when no longer hovering on feature
function resetHighlight(e) {
	geojson.resetStyle(e.target);
	info.update();
	set_data_field();
}

//zooms to feature when clicking feature
function zoomToFeature(e) {
	map.fitBounds(e.target.getBounds());
}

// enable hovering, reset of hovering, and zooming upon each feature
function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		click: zoomToFeature
	});
}

// sets style on geojson data and adds it to map
	var geojson;

	geojson = L.geoJson(countries, {
		style: style,
		onEachFeature: onEachFeature,
	}).addTo(map);

// COVID attribution
	map.attributionControl.addAttribution('COVID data from <a href="https://www.worldometers.info/coronavirus/">Worldometers</a>');

// creating the legend
	var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
				
		grades = get_grades(document.getElementById('numbers').value),
			labels = [],
			from, to;
		
		var field = document.getElementById('numbers').value;
		var grades_vals = grades.slice();
		grades.reverse();
		var incr = 1;
		var num_mult = 1;
		var end_sym = '';
		var colors = color_ramp(field);
		var grades_style = grades_vals.slice()

		if (field == 'total_recovered'){
			incr = 0.01;
			num_mult = 100;
			end_sym = "%";
		} else if (field == 'cases_x_ppl' | field == 'deaths_x_ppl'){
			grades_vals.reverse()
		}
		
		var empty_val = 'None'
		var remove_nones = ['total_recovered','total_tests','tests_1m','tests_x_ppl'];
		if (remove_nones.includes(field) == false){
			if (field == 'population'){empty_val = 'Unknown'}
			labels.push(
				'<i style="background:' + colors.slice(-1)[0] + '"></i> ' +
				empty_val);
		}

		for (var i = 0; i < grades.length; i++) {
			from = grades[i];
			to = grades[i + 1];

			labels.push(
				'<i style="background:' + color_assign(from + incr,grades_style,colors) + '"></i> ' 
				+ (to ? '':'>') + (from*num_mult).toLocaleString('en') + 
				(to ? '&ndash;' + (to*num_mult).toLocaleString('en') + end_sym : end_sym));
		}
		var none_in_back = ['rank','cases_x_ppl','deaths_x_ppl'];
		if (none_in_back.includes(field)){
			labels.push(labels.shift());
		}

		var add_unknown = ['rank','total_cases','new_cases','critical_cases','population'];

		if(add_unknown.includes(field) == false){
			labels.push(
			'<i style="background:' + colors.slice(-2)[0] + '"></i> ' +
				'Unknown');
		}

		div.innerHTML = labels.join('<br>');
		return div;
	};

    legend.addTo(map);
	

// updates data when choosing option from dropdown	
function set_data_field(){ document.getElementById('numbers').addEventListener('change',function(){
	map.removeControl(legend);
	geojson.eachLayer(function (layer) { 
		style_value = get_fields(layer.feature.properties)[2];
		layer.setStyle({fillColor:style_value}); 
	});
	legend.addTo(map);
})};

set_data_field();
