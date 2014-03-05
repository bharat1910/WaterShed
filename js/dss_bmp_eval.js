	/*
	 * The main file with Javascript utility methods for the decision support system 
	 */

	var map; //global variable for the map
	var hrulayer_id;//global sequence id to assign to hru layers	
	
	//global variable for single simulation result. The result will be retrieved from server and the format is:
	//<sed value>,<sed base red>,<nit value>,<nit base red>,<ph value>,<ph base red>,<avg value>,<avg base red>,<cost> : Note- "base" means the case with "no BMP"
	var single_simu_result = new Array();
	
	//each element will contain hru_ids delimited by a comma. 
	//each element represents the list of hru_id chosen for the bmp, corresponding to a point in the chart
	//use: when the user clicks on a point in the chart, we fetch the corresponding element's hru_id list, then use them for showing it on the map
	var chart_hru_id_nit = new Array();//for nitrate
	var chart_hru_id_pho = new Array();//for phosphorous
	
	
	//flag to hold the bmp selected by user for evaluation. -1 implies that more than one bmp has been selected. 
	//0 implies No bmp is selected,1 implies FS (Filter Strip),2 implies GW (Grassed Waterway),3 implies CW (Constructed Wetlands),
	//4 implies BR (Bioreactors), 5 implies CC (Crop Cover),6 implies DM (Drainage Water Management),
	//7 implies SB (Saturated Buffer),8 implies NM (Nutrient Management (4Rs – Right source, rate, time, place)),9 implies PC (Perennial Crops)
	var single_simu_bmp;
	
	/*
	 * BMP Parameters. Each BMP has some parameters like cost that needs to be collected from user
	 * the default values are assigned at random. There are no rules for them.
	 * They will be replace by the values entered by the user.
	 * The OCM model expects some values for all parameters. the parameters may not have values if a BMP is not selecte,
	 * So, decided to assign some random values.
	 */
	//FS
	var bmp_param_fs_cost = "100";
	//GW
	var bmp_param_gw_cost = "100";
	//CW
	var bmp_param_cw_cost = "100";
	//BR
	var bmp_param_br_cost = "100";
	//CC
	var bmp_param_cc_cost = "100";
	var bmp_param_cc_type = "1";
	//DM
	var bmp_param_dm_cost = "100";
	//SB
	var bmp_param_sb_cost = "100";
	//NM
	var bmp_param_nm_cost1 = "100";
	var bmp_param_nm_cost2 = "100";
	var bmp_param_nm_cost3 = "100";
	var bmp_param_nm_cost4 = "100";
	var bmp_param_nm_rate = "160";
	var bmp_param_nm_ratio1 = "0.1";
	var bmp_param_nm_ratio2 = "0.5";	
	//PC
	var bmp_param_pc_cost = "100";
	var bmp_param_pc_type = "1";
	
	var bmp_map = new Object();
	bmp_map[1] = "Filter Strip (FS)";
	bmp_map[2] = "Grassed Waterways (GW)";
	bmp_map[3] = "Constructed Wetland (CW)";
	bmp_map[4] = "Bioreactors (BR)";
	bmp_map[5] = "Crop Cover (CC)";
	bmp_map[6] = "Drainage Water Management (DM)";
	bmp_map[7] = "Saturated Buffer (SB)";
	bmp_map[8] = "Nutrient Management (NM)";
	bmp_map[9] = "Perennial Crops (PC)";
		
	//This is a first step when a user wants to do an evaluation
	//Display the map in the user interface based on the water shed selected
	function displayMap(){
		
		/***clear up all existing data***/
		if(typeof(map) != "undefined" ){
			map.destroy("map");
		}
		
		$("#downloadReport").show();
		$("#reportFileType").show();
		
		//initialize sequence id for hru layers
		hrulayer_id = 0;
		
		single_simu_bmp = "0";
		//empty these arrays
		single_simu_result.length = 0;
		chart_hru_id_nit.length = 0;
		chart_hru_id_pho.length = 0;
		
		//remove all options from the select element
		document.getElementById("subbasin_id").options.length = 0;
		var optn = document.createElement("OPTION");
		optn.text = "";
		optn.value = "default";
		document.getElementById("subbasin_id").options.add(optn);
		//end here
		
		//remove all elements from selected subbasins list and the hidden select for the subbasins
		document.getElementById("hruIDs_temp").options.length = 0;
		document.getElementById("hruIDs_area_temp").options.length = 0;
		document.getElementById("selected_subbasin_bmp").options.length = 0;
		document.getElementById("selected_subbasins").options.length = 0;
		document.getElementById("selected_subbasin_temp").options.length = 0;
		
		//set the cost for BMPs to zero
		document.getElementById("bmp_cost").value = "";
		for(var i=1 ; i < document.getElementById("selected_bmps").options.length ; i++){
			document.getElementById("selected_bmps").options[i].value = "100"; //set to the default value: 100 is chosen as default here
		}
		
		//remove the hru_info div element
		var hru_info_div = document.getElementById("hru_info");
//		while( hru_info_div.hasChildNodes() ){
//			hru_info_div.removeChild(hru_info_div.lastChild);
//		}
		
		if(document.getElementById("wstype").value == "default"){
			hideReportLinks();
			return;
		}
		else if(document.getElementById("wstype").value == "bd"){
			hideReportLinks();
			document.getElementById("bd_report").style.display="block";
		}
		else if(document.getElementById("wstype").value == "blc"){
			hideReportLinks();
			document.getElementById("blc_report").style.display="block";
		}
		
		bmpParamDisplayOff();
		/***clear up all existing data ends here***/
		
		require(["esri/map", "esri/layers/FeatureLayer",
			"dojo/domReady!"],
			function() {
			var ws_url;
			var mapserver_url;
			var bounds;
			
			//decide the extent for each map
			if(document.getElementById("wstype").value == "blc"){
				bounds = new esri.geometry.Extent({"xmin":-9894100.49722937,"ymin":4823500.2917971,"xmax":-9879214.17921767,"ymax":4847453.47319821,"spatialReference":{"wkid":102100}});
			}
			else if(document.getElementById("wstype").value == "bd"){
				//bounds = new esri.geometry.Extent({"xmin":-9818868.92396209,"ymin":4915761.00783883,"xmax":-9814803.41427354,"ymax":4919377.28252372,"spatialReference":{"wkid":102100}});
				bounds = new esri.geometry.Extent({"xmin":-9834196.39104974,"ymin":4898742.83941247,"xmax":-9811952.79250453,"ymax":4920093.04486336,"spatialReference":{"wkid":102100}});
			}
			//decide the extent for each map end here
			
			//create a map instance
			map = new esri.Map("map", { 
				extent: bounds
			});
			
			//create an ArcGISDynamicMapServiceLayer instance for rendering "water shed" and "reach" layers
			mapserver_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer";
			var imageParameters = new esri.layers.ImageParameters();
			imageParameters.format = "jpeg";
			var map_layers = new esri.layers.ArcGISDynamicMapServiceLayer(mapserver_url, {"imageParameters":imageParameters});
			
			//ws_url: this url points to watershed map. we need to this to query subbasins which is done later in the function
			//map_layers: Except for HRU layer, other layers are set to visible(RCH,Subbasin,WS) 
			if(document.getElementById("wstype").value == "blc"){				
				ws_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/2";				
				map_layers.setVisibleLayers([2,0,1]);
			}
			else if(document.getElementById("wstype").value == "bd"){
				ws_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/6"; 
				map_layers.setVisibleLayers([6,4,5]);
			}
			
			//add the layers to the map
			map.addLayer(map_layers);
			
			//query the subbasin IDs when the map is chosen
			//this subbasin list will be displayed for user
			var queryTask = new esri.tasks.QueryTask(ws_url);
			var query = new esri.tasks.Query();
			query.returnGeometry = false;
			query.where = "1=1";
			query.outFields = ["Subbasin"];
			queryTask.execute(query,function(objectIds) {
				var i;
				for (i=0; i < objectIds.features.length;i++){
					var featureAttributes = objectIds.features[i].attributes;
					var optn = document.createElement("OPTION");
					optn.text = featureAttributes["Subbasin"];
					optn.value = featureAttributes["Subbasin"];
					document.getElementById("subbasin_id").options.add(optn);
				}
				document.getElementById("subbasin_id").options.selectedIndex=0;
				
				$("#subbasin_label").show();
				$("#subbasin_id").show();
				$("#bmp_label").show();
				$("#bmp").show();
				$("#subbasin_id").chosen();
				$("#bmp").chosen();
			}, function(errorMsg){
				alert("Error while fetching Subbasin IDs:"+errorMsg);
			});
			
			//zoom level setting when the map is displayed in the screen
			if(document.getElementById("wstype").value == "blc"){
				map.setLevel(-1);
			}
			else if(document.getElementById("wstype").value == "bd"){
				map.setLevel(6);
			}
			
			}
		  );
	  }
	
	//when a subbasin is selected by the user, display the HRU IDs in that subbasin
	function displayHruIDs(){
		var hru_url;
		var i;
		
		$("#showChartData").show();
		
		//just make sure to clear the temp list hruIDs
		document.getElementById("hruIDs_temp").options.length = 0;
		document.getElementById("hruIDs_area_temp").options.length = 0;
		
		//remove the hru_info div element
		//var hru_info_div = document.getElementById("hru_info");
//		while( hru_info_div.hasChildNodes() ){
//			hru_info_div.removeChild(hru_info_div.lastChild);
//		}
		
		if(document.getElementById("subbasin_id").value == "default"){			
			return;
		}
		
		//validation to check for already selected subbasin
		//if subbasin is already selected for BMP,just give an alert message and return
		for(i=0 ; i < document.getElementById("selected_subbasin_temp").options.length ; i++){
			if( document.getElementById("subbasin_id").value == document.getElementById("selected_subbasin_temp").options[i].value ){
				alert("Subbasin "+document.getElementById("subbasin_id").value+" is already selected for BMP.");
				document.getElementById("subbasin_id").value = "default";
				return;
			}
		}		
		
		//select the hru_url based on watershed type
		if(document.getElementById("wstype").value == "blc"){
			hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/3";
		}
		else if(document.getElementById("wstype").value == "bd"){
			hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/7";
		}	
		
		//get hru ids in the selected subbasin
		require(["esri/map", "esri/layers/FeatureLayer",
			"dojo/domReady!"],
			function() {				
				var hru_ids;
				var queryTask = new esri.tasks.QueryTask(hru_url);
				var query = new esri.tasks.Query();
				query.returnGeometry = false;
				query.where = "SUBBASIN = " +document.getElementById("subbasin_id").value + " AND LANDUSE = 'AGRR'";
				query.outFields = ["HRU_ID","HRU_FR"];
				queryTask.execute(query,function(objectIds) {
					var i;
					//hru_ids = "";
					//var hru_info_div = document.getElementById("hru_info");
					var hru_info_temp_select$ = $("#hru_info_temp_select");
					hru_info_temp_select$.empty();
					//while( hru_info_div.hasChildNodes() ){
//						hru_info_div.removeChild(hru_info_div.lastChild);
//					}
					
					//hru_info_div_temp$.append("<select id='hru_info_temp_select' data-placeholder='Select HRUs ...'  multiple style='width:30%; height:1%' onchange='hruSelectionChange()'></select>");
					
					for (i=0; i < objectIds.features.length;i++){
						var featureAttributes = objectIds.features[i].attributes;
						/*if(i != objectIds.features.length-1){
							hru_ids = hru_ids + featureAttributes["HRU_ID"].toString() + ",";
						}else{
							hru_ids = hru_ids + featureAttributes["HRU_ID"].toString();
						}*/
						//add the HRU as a checkbox						
//						var checkbox = document.createElement("input"); 
//						checkbox.setAttribute("type", "checkbox");
//						checkbox.setAttribute("name", ""); //name is used to store the BMP assigned later for this HRU
//						checkbox.setAttribute("id", featureAttributes["HRU_ID"]); // stores the hru id
//						checkbox.setAttribute("value", Math.floor(featureAttributes["HRU_FR"]*100*100)/100); // stores the fraction of subbasin area
//						hru_info_div.appendChild(checkbox);
						
//						//create labels for the HRU IDs
//						var label = document.createElement('label')
//						label.htmlFor = featureAttributes["HRU_ID"];
//						label.appendChild(document.createTextNode("HRU "+featureAttributes["HRU_ID"].toString()+"("+Math.floor(featureAttributes["HRU_FR"]*100*100)/100+"%)"));
//						hru_info_div.appendChild(label);
						//add the HRU as a checkbox ends here
						
						hru_info_temp_select$.append("<option value='" + featureAttributes["HRU_ID"] + "' percent='" + Math.floor(featureAttributes["HRU_FR"] * 100  * 100) / 100 +"'>" + 
												  "HRU "+ featureAttributes["HRU_ID"].toString() +
								 				  "("+ Math.floor(featureAttributes["HRU_FR"] * 100  * 100) / 100 + "%)" + "</option>");
						
//						//add the HRU IDs to a temp list
//						var optn_temp = document.createElement("OPTION");
//						optn_temp.text = featureAttributes["HRU_ID"];
//						optn_temp.value = featureAttributes["HRU_ID"];
//						document.getElementById("hruIDs_temp").options.add(optn_temp);
						
						//add the area fraction of HRU IDs to a temp list
//						var optn_area = document.createElement("OPTION");
//						optn_area.text = Math.floor(featureAttributes["HRU_FR"]*100*100)/100;
//						optn_area.value = Math.floor(featureAttributes["HRU_FR"]*100*100)/100;
//						document.getElementById("hruIDs_area_temp").options.add(optn_area);
					}
					
					hru_info_temp_select$.show();
					$("#select_all_hru").show();
					$("#hru_percent").show();
					$("#assign_bmp_button").show();
					$("#reset_bmp_button").show();
					$("#evaluate").show();
					$("#checkSelection").show();
					
					showMessage("Non agricultural HRU's are not eligible for a BMP!");
					
					if (window.onSelectChosen == true) {
						hru_info_temp_select$.trigger("chosen:updated");
						hru_info_temp_select$.hide();
					} else {
						hru_info_temp_select$.chosen({width: "30%"});
						window.onSelectChosen = true;
					}
				}, function(errorMsg){
					alert("Error while fetching HRU IDs:"+errorMsg);
				});		
			}
		);

	}
	
	function hruSelectionChange()
	{
		var percent = 0;
		$("#hru_info_temp_select option:selected").each( function() {
			percent += parseFloat($(this).attr('percent'));
		});
		
		$("#hru_percent").val(percent);
	}
	
	/*
	 * Certain BMPs (BR/SB/DM) cannot be assigned for certain HRUs.
	 * This data is loaded during form load.
	 * Refer to dss_hru_bmp_constraint.js
	 */
	function checkHRUBMPConstraints(){
		var bmp = $("#bmp").val();
		var ws =  $("#wstype").val();
		var constraintArray;
		var restrictedHRUs = "";
		/*if(bmp == "1" &&  ||
		   bmp != "4" ||
		   bmp != "6" ||
		   bmp){
			//if the bmp is not BR/SB/DM then there are no constraints
			return "";
		}*/
		
		//select which constraint array to choose
		if(ws == "bd"){
			switch(bmp){
			case "1": //FS
				constraintArray = bd_hru_const_fs;
				break;
			case "2": //GW
				constraintArray = bd_hru_const_gw;
				break;
			case "3": //CW
				constraintArray = bd_hru_const_cw;
				break;
			case "5": //CC
				constraintArray = bd_hru_const_cc;
				break;
			case "8": //NM
				constraintArray = bd_hru_const_nm;
				break;
			case "9": //PC
				constraintArray = bd_hru_const_pc;
				break;
			case "4": //BR
				constraintArray = bd_hru_const_br;
				break;
			case "6": //DM
				constraintArray = bd_hru_const_dm;
				break;
			case "7": //SB
				constraintArray = bd_hru_const_sb;
				break;
			}			
		}
		else if (ws == "blc"){
			switch(bmp){
			case "1": //FS
				constraintArray = blc_hru_const_fs;
				break;
			case "2": //GW
				constraintArray = blc_hru_const_gw;
				break;
			case "3": //CW
				constraintArray = blc_hru_const_cw;
				break;
			case "5": //CC
				constraintArray = blc_hru_const_cc;
				break;
			case "8": //NM
				constraintArray = blc_hru_const_nm;
				break;
			case "9": //PC
				constraintArray = blc_hru_const_pc;
				break;
			case "4": //BR
				constraintArray = blc_hru_const_br;
				break;
			case "6": //DM
				constraintArray = blc_hru_const_dm;
				break;
			case "7": //SB
				constraintArray = blc_hru_const_sb;
				break;
			}	
		}
		//select which constraint array to choose ENDS
		
		/*If the bmp does not have any constraints
		 * then just return 
		 */		
		if(constraintArray == "") return "";
		
		//check if the HRUs are in the constraint array
		//collect the restricted HRUs
		$("#hru_info_temp_select option:selected").each(function() {
			var id = $(this).val();
			for(j=0; j<constraintArray.length; j++){
				if(parseInt(id) == parseInt(constraintArray[j])){
					$(this).attr('selected', false);
					restrictedHRUs = restrictedHRUs + "," + id;
					break;
				}						
			}
		});
		
		$("#hru_info_temp_select").trigger("chosen:updated");		
		
		return restrictedHRUs;
	}
	
	function assignBMP(){
		var i;
		
		if($("#hru_info_temp_select option:selected").length == 0){
			showMessage("No HRUS selected for BMP!");
			return;
		}
		if($("#bmp option:selected").val() == "default"){
			showMessage("Select a BMP!");
			return;
		}
		
		if(! verifyBMPParams(document.getElementById("bmp").options[document.getElementById("bmp").selectedIndex].value)) return;
		
		var restrictHRU = checkHRUBMPConstraints();
		if(restrictHRU != ""){
			$("#info_label").empty().append($("#bmp option:selected").text() + " cannot be applied in the HRUs: "+ restrictHRU + " .So, they have been unselected.").show(1000);
			if(! confirm("Do you want to assign BMPs for the remaining selected HRUs ?")){
				return;
			}
		}
		
		area_fraction = 0;
		$("#hru_info_temp_select option:selected").each(function() {
			$(this).attr('bmp', $("#bmp").val());
			$("#hru_info_temp_select_duplicate").append($(this))
			area_fraction = parseFloat(area_fraction) + parseFloat($(this).attr('percent'));
		});
		
		$("#hru_info_temp_select option:selected").each(function() {
			$(this).attr('selected', false);
		});
		$("#hru_info_temp_select").trigger("chosen:updated");
		
		if(area_fraction == 0){
			showMessage("Select HRUs for BMP");
		}
		else{
			showMessage(Math.floor(parseFloat(area_fraction)*100)/100 + " % of Subbasin has been assigned "+ $("#bmp option:selected").text());
		}
		
		addSubbasinForBMP();
	}
	
	function clearBMP(){
		var i;
		if(document.getElementById("hruIDs_temp").options.length == 0){
			alert("No BMPs assigned for HRUs.");
			return;
		}
		var prompt = confirm("Do you want to reset BMPs selected for the HRUs ? All BMPs assigned for this subbasin will be lost!");
		if(prompt == true){
			for(i=0 ; i < document.getElementById("hruIDs_temp").options.length ; i++){
				var hru_id = document.getElementById("hruIDs_temp").options[i].value;
					document.getElementById(hru_id).setAttribute("name","");
					document.getElementById(hru_id).disabled = false;
					document.getElementById(hru_id).checked = false;
			}
		}
	}
	
	function verifyBMPParams(bmpType){
		if(bmpType == "default") return true;
		switch(bmpType){
		case "1":
			if(document.getElementById("bmp_params_fs_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_fs_cost = document.getElementById("bmp_params_fs_cost").value;
			}
			break;
		case "2":
			if(document.getElementById("bmp_params_gw_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_gw_cost = document.getElementById("bmp_params_gw_cost").value;
			}
			break;
		case "3":
			if(document.getElementById("bmp_params_cw_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_cw_cost = document.getElementById("bmp_params_cw_cost").value;
			}
			break;
		case "4":
			if(document.getElementById("bmp_params_br_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_br_cost = document.getElementById("bmp_params_br_cost").value;
			}
			break;
		case "5":
			if(document.getElementById("bmp_params_cc_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_cc_cost = document.getElementById("bmp_params_cc_cost").value;
				bmp_param_cc_type = document.getElementById("bmp_params_cc_type").options[document.getElementById("bmp_params_cc_type").selectedIndex].value;				
			}
			break;
		case "6":
			if(document.getElementById("bmp_params_dm_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_dm_cost = document.getElementById("bmp_params_dm_cost").value;
			}
			break;
		case "7":
			if(document.getElementById("bmp_params_sb_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_sb_cost = document.getElementById("bmp_params_sb_cost").value;
			}
			break;
		case "8":
			if(document.getElementById("bmp_params_nm_cost1").value == "" ||
					document.getElementById("bmp_params_nm_cost2").value == "" ||
					document.getElementById("bmp_params_nm_cost3").value == ""  ||
					document.getElementById("bmp_params_nm_cost4").value == ""  ||
					document.getElementById("bmp_params_nm_rate").value == ""  ||
					document.getElementById("bmp_params_nm_ratio1").value == ""  ||
					document.getElementById("bmp_params_nm_ratio2").value == "" ){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_nm_cost1 = document.getElementById("bmp_params_nm_cost1").value;
				bmp_param_nm_cost2 = document.getElementById("bmp_params_nm_cost2").value;
				bmp_param_nm_cost3 = document.getElementById("bmp_params_nm_cost3").value;
				bmp_param_nm_cost4 = document.getElementById("bmp_params_nm_cost4").value;
				bmp_param_nm_rate = document.getElementById("bmp_params_nm_rate").value;
				bmp_param_nm_ratio1 = document.getElementById("bmp_params_nm_ratio1").value;
				bmp_param_nm_ratio2 = document.getElementById("bmp_params_nm_ratio2").value;
			}
			break;
		case "9":
			if(document.getElementById("bmp_params_pc_cost").value == ""){
				alert("Enter all parameters for the BMP.");
				return false;
			}
			else{
				bmp_param_pc_cost = document.getElementById("bmp_params_pc_cost").value;
				bmp_param_pc_type = document.getElementById("bmp_params_pc_type").options[document.getElementById("bmp_params_pc_type").selectedIndex].value;
			}
			break;
		}
		
		return true;
	}
	
	function addSubbasinForBMP(){
		
		//verify if all parameters are entered for the BMP
		if(! verifyBMPParams($("#bmp").val())) return;
		
		var i;
		var bmp_subbasin;
		var fraction_bmp = new Array();
		var hru_IDs; //collect hru_IDs for querying from map layer
		var hru_url;
		
		//intialize array indexes 1,2,3
		fraction_bmp[1] = 0;
		fraction_bmp[2] = 0;
		fraction_bmp[3] = 0;
		fraction_bmp[4] = 0;
		fraction_bmp[5] = 0;
		fraction_bmp[6] = 0;
		fraction_bmp[7] = 0;
		fraction_bmp[8] = 0;
		fraction_bmp[9] = 0;
				
		bmp_subbasin = "";
		$("#hru_info_temp_select_duplicate > option").each(function() {
			var hru_id = $(this).val();
			var bmp = $(this).attr('bmp');
			var hru_fr = $(this).attr('percent');

			if(bmp != ""){
				if(bmp_subbasin == ""){
					bmp_subbasin = hru_id + "," + bmp;
					hru_IDs = hru_id;
				}else{
					bmp_subbasin = bmp_subbasin + ";" + hru_id + "," + bmp;
					hru_IDs = hru_IDs + "," +hru_id;
				}
				switch(bmp){
					case "1":
						fraction_bmp[1] = parseFloat(fraction_bmp[1]) + parseFloat(hru_fr);
						break;
					case "2":
						fraction_bmp[2] = parseFloat(fraction_bmp[2]) + parseFloat(hru_fr);
						break;
					case "3":
						fraction_bmp[3] = parseFloat(fraction_bmp[3]) + parseFloat(hru_fr);
						break;
					case "4":
						fraction_bmp[4] = parseFloat(fraction_bmp[4]) + parseFloat(hru_fr);
						break;
					case "5":
						fraction_bmp[5] = parseFloat(fraction_bmp[5]) + parseFloat(hru_fr);
						break;
					case "6":
						fraction_bmp[6] = parseFloat(fraction_bmp[6]) + parseFloat(hru_fr);
						break;
					case "7":
						fraction_bmp[7] = parseFloat(fraction_bmp[7]) + parseFloat(hru_fr);
						break;
					case "8":
						fraction_bmp[8] = parseFloat(fraction_bmp[8]) + parseFloat(hru_fr);
						break;
					case "9":
						fraction_bmp[9] = parseFloat(fraction_bmp[9]) + parseFloat(hru_fr);
						break;
				}
			}			
		});

		//alert(hru_IDs);
		if(bmp_subbasin == "") {
			showMessage("No BMPs are assigned for the subbasin!");
		}
		else{		
			//select the hru_url based on watershed type
			if($("#wstype").val() == "blc"){
				hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/3";
			}
			else if($("#wstype").val() == "bd"){
				hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/7";
			}
		
			//create a map layer for displaying selected HRUs
			require(["esri/map", "esri/layers/FeatureLayer",
			"dojo/domReady!"],
			function() {
				var hru_layer = new esri.layers.FeatureLayer(hru_url,{id:++hrulayer_id});
				hru_layer.setDefinitionExpression("HRU_ID IN ("+hru_IDs+")");		
				//add the layer to the map
				map.addLayer(hru_layer);
			});
		
			//add the BMPs selected to the temp list
			var optn = document.createElement("OPTION");
			optn.text = bmp_subbasin;
			optn.value = bmp_subbasin;
			document.getElementById("selected_subbasin_bmp").options.add(optn);
			//ends here
			
			//add the BMPs selected to the selected subbasin list for display
			var optn_1 = document.createElement("OPTION");
			optn_1.text = "Subbasin "+document.getElementById("subbasin_id").value+": "+"FS-"+Math.floor(parseFloat(fraction_bmp[1]))+"% ,"+
																						"GW-"+Math.floor(parseFloat(fraction_bmp[2]))+"% ,"+
																						"CW-"+Math.floor(parseFloat(fraction_bmp[3]))+"% ,"+
																						"BR-"+Math.floor(parseFloat(fraction_bmp[4]))+"% ,"+
																						"CC-"+Math.floor(parseFloat(fraction_bmp[5]))+"% ,"+
																						"DM-"+Math.floor(parseFloat(fraction_bmp[6]))+"% ,"+
																						"SB-"+Math.floor(parseFloat(fraction_bmp[7]))+"% ,"+
																						"NM-"+Math.floor(parseFloat(fraction_bmp[8]))+"% ,"+
																						"PC-"+Math.floor(parseFloat(fraction_bmp[9]))+"%";
			optn_1.value = hrulayer_id; //save map layer id for this set of HRUs
			//also create the hru_layer and save the map layer id in the value attribute
			document.getElementById("selected_subbasins").options.add(optn_1);
			//ends here
			
			for (var i=1; i<=9; i++) {
				if (fraction_bmp[i] != 0) {
					$("#selection_popup table").append("<tr><td class='popup-tr'>"+document.getElementById("subbasin_id").value+"</td>"+
							"<td class='popup-tr'>" + bmp_map[i] + "</td>"+
							"<td class='popup-tr'>" + Math.floor(parseFloat(fraction_bmp[i])) + "%</td></tr>");
				}
			}
			
			//the subbasin id is also added to the temp list which is hidden in the html
			var optn_2 = document.createElement("OPTION");
			optn_2.text = document.getElementById("subbasin_id").value;
			optn_2.value = document.getElementById("subbasin_id").value;
			document.getElementById("selected_subbasin_temp").options.add(optn_2);
			
			//delete the hru_info div element
			$("#hru_info_temp_select > option").each(function() {
				$(this).attr('selected', false);				
			});
			$("#hru_info_temp_select").trigger("chosen:updated");
			
			showMessage("Assigned BMPs for Subbasin " + $("#subbasin_id").val() + " have been added");
			
			$("#hru_info_temp_select_duplicate").empty();
		}
	}
	
	function hideInfoLabel()
	{
		$("#info_label").hide();
	}
	
	function showMessage(msg)
	{
		$("#info_label").empty().append(msg).show(1000);
		setTimeout(hideInfoLabel, 5000);
	}
	
	function removeSubbasinForBMP(){
		var i;
		var hru_url;
		if(document.getElementById("selected_subbasins").options.length == 0){
			alert("Please Add Subbasins for BMP");
			return;
		}
		for(i=0 ; i < document.getElementById("selected_subbasins").options.length ; i++){
			if( document.getElementById("selected_subbasins").options[i].selected){
				//remove the map layer
				var hru_layer = map.getLayer(document.getElementById("selected_subbasins").options[i].value);
				//remove the layer from the map
				map.removeLayer(hru_layer);
			
				//remove from the lists
				document.getElementById("selected_subbasin_bmp").remove(i);
				document.getElementById("selected_subbasin_temp").remove(i);
				document.getElementById("selected_subbasins").remove(i);
				alert("Selected subbasin removed for BMP");
			}
		}
	}
	
	function assignBMPCost(){
		if(document.getElementById("selected_subbasins").options.length == 0){
			alert("Select Subbasins for BMP");
			return;
		}
	
		if(document.getElementById("selected_bmps").value == "default"){
			alert("Select a BMP for assigning cost");
			return;
		}
	
		var bmp_cost = document.getElementById("bmp_cost").value;
		if( !isNaN(bmp_cost) ){
			if( bmp_cost == 0 ){
				alert("Enter a cost greater than 0");
				return;
			}
			document.getElementById("selected_bmps").options[document.getElementById("selected_bmps").selectedIndex].value = bmp_cost;
			alert(bmp_cost +" USD per hectare assigned for "+document.getElementById("selected_bmps").options[document.getElementById("selected_bmps").selectedIndex].text);
		}
		else{
			alert("Enter a valid cost");
			return;
		}
	}
	
	function displayCost(){
		if(document.getElementById("selected_bmps").value == "default") {
			document.getElementById("bmp_cost").value = "";
			return;
		}
		document.getElementById("bmp_cost").value = document.getElementById("selected_bmps").options[document.getElementById("selected_bmps").selectedIndex].value;
	}
	
	function startAgain(){
		$("#main :input").attr("disabled", false); //enable the "main" div element
		
		document.getElementById("wstype").value = "default";
		document.getElementById("bmp").value = "default";
		bmpParamDisplayOff();
		displayMap();
		
		//remove the table
		var chart_div = document.getElementById("bmp_table");
		while( chart_div.hasChildNodes() ){
			chart_div.removeChild(chart_div.lastChild);
		}
		//remove the chart
		var chart_div = document.getElementById("bmp_chart_nit");
		while( chart_div.hasChildNodes() ){
			chart_div.removeChild(chart_div.lastChild);
		}
		/*chart_div = document.getElementById("bmp_chart_pho");
		while( chart_div.hasChildNodes() ){
			chart_div.removeChild(chart_div.lastChild);
		}*/
	}
	
	//validation check: when user submits for evaluation, verify if cost is entered for a selected bmp.
	function checkCost(){
		var bmp = new Array();
		var bmp_cost = new Array();
		var i;
		
		for(i=1 ; i < document.getElementById("selected_bmps").options.length ; i++){
			bmp_cost[i] = document.getElementById("selected_bmps").options[i].value;
			//alert(bmp_cost[i]);
		}
		
		//initialize BMPs to 0: 0 implies bmp is not selected
		bmp[1] = 0; //FS
		bmp[2] = 0; //GW
		bmp[3] = 0; //CW
		bmp[4] = 0; //BR
		bmp[5] = 0; //CC
		bmp[6] = 0; //DM
		bmp[7] = 0; //SB
		bmp[8] = 0; //NM
		bmp[9] = 0; //PC
		
		//global varibale single_simu_bmp
		single_simu_bmp = "0";
		//if bmp is selected by the user, then mark it in the array bmp[i]
		for(i=0 ; i < document.getElementById("selected_subbasin_bmp").options.length ; i++){
			var j;
			var val = (document.getElementById("selected_subbasin_bmp").options[i].value).split(";");
			for(j=0; j < val.length; j++){
				switch(val[j].substring(val[j].indexOf(",")+1)){
					case "1"://FS
						bmp[1] = "1";
						if(bmp_cost[1] == "0"){
							alert("Enter a cost for Filter Strip!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "1"){
							single_simu_bmp = "1";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "2"://GW
						bmp[2] = "2";
						if(bmp_cost[2] == "0"){
							alert("Enter a cost for Grassed Waterways!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "2"){
							single_simu_bmp = "2";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "3"://CW
						bmp[3] = "3";
						if(bmp_cost[3] == "0"){
							alert("Enter a cost for Constructed Wetlands!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "3"){
							single_simu_bmp = "3";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "4"://BR
						bmp[4] = "4";
						if(bmp_cost[4] == "0"){
							alert("Enter a cost for Bioreactors!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "4"){
							single_simu_bmp = "4";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "5"://CC
						bmp[5] = "5";
						if(bmp_cost[5] == "0"){
							alert("Enter a cost for Crop Cover!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "5"){
							single_simu_bmp = "5";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "6"://DM
						bmp[6] = "6";
						if(bmp_cost[6] == "0"){
							alert("Enter a cost for Drain Water Management!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "6"){
							single_simu_bmp = "6";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "7"://CW
						bmp[7] = "7";
						if(bmp_cost[7] == "0"){
							alert("Enter a cost for Saturated Buffer!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "7"){
							single_simu_bmp = "7";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "8"://NM
						bmp[8] = "8";
						if(bmp_cost[8] == "0"){
							alert("Enter a cost for Nutrient Management!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "8"){
							single_simu_bmp = "8";
						}else{
							single_simu_bmp = "-1";
						}
						break;
					case "9"://PC
						bmp[9] = "9";
						if(bmp_cost[9] == "0"){
							alert("Enter a cost for Perennial Crops!");
							return 0;
						}
						if(single_simu_bmp == "0" || single_simu_bmp == "9"){
							single_simu_bmp = "9";
						}else{
							single_simu_bmp = "-1";
						}
						break;
				}
			}
			//if all bmps are set and cost is entered, then just exit the loop
			if(bmp[1] == "0" || bmp[2] == "0" || bmp[3] == "0" || bmp[4] == "0" || bmp[5] == "0" || bmp[6] == "0" || bmp[7] == "0" || bmp[8] == "0" || bmp[9] == "0") continue;
			else break;
		}
		
		return 1;
	}
	
	//Function for click on "Evaluate" button
	$(document).ready(function(){
	  $("#evaluate").click(function(){		
	  
		//check if any bmp is added
		if(document.getElementById("selected_subbasins").options.length == 0){
			alert("No BMPs added for evaluation");
			return;
		}
		
		//check if cost is entered for a selected bmp
		//this method also sets "single_simu_bmp" which indicates whether the user had selected one or more BMP for evaluation
		if(checkCost() == "0"){
			return;
		}
		//get hru_ids from map layer deployed in ArcGIS Server;put them in asc order; mark the HRUs assigned with bmp
		require(["esri/map", "esri/layers/FeatureLayer",
			"dojo/domReady!"],
			function() {
				var hru_url;
				//select the hru_url based on watershed type
				if(document.getElementById("wstype").value == "blc"){
					hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/3";
				}
				else if(document.getElementById("wstype").value == "bd"){
					hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/7";
				}			
				
				//get all HRU_ID from the map
				var queryTask = new esri.tasks.QueryTask(hru_url);
				var query = new esri.tasks.Query();
				query.returnGeometry = false;
				query.where = "LANDUSE = 'AGRR'";
				query.outFields = ["HRU_ID"];
				
				var queryResult = new Array();
				queryTask.execute(query,function(objectIds) {
						var hru_id_list = new Array();//to store all hru_id in ascending order	
						var hru_bmp_list = new Array();//to store bmp for all hru_id
						var hru_bmp_assigned_list = new Array();//to store bmp assigned by the user. this list will contain only hru_id/bmp selected by user
						var final_cost;
						var final_bmp;
						var single_simulation_result = new Array();// expecting 9 elements: 0 - flow's absolute value, 1: flow's % reduction, 2 - nitrate's absolute value, 3: nitrate's % reduction, 
						//4 - phosphorous's absolute value, 5: phosphorous's % reduction, 6 - average nutrient absolute value,7 : average nutrient % reduction, 8: Unit Cost (USD)
						var ws;
						var i,k;
						
						//select watershed
						switch($("#wstype").val()){
							case "bd":
								ws = "1";
								break;
							case "blc":
								ws = "2";
								break;
						}					
						//prepare cost
						final_cost = "";
						/*for(i=1 ; i < document.getElementById("selected_bmps").options.length -1 ; i++){
								final_cost = final_cost + document.getElementById("selected_bmps").options[i].value + ",";
						}
						final_cost = final_cost + document.getElementById("selected_bmps").options[document.getElementById("selected_bmps").options.length -1].value;*/
						final_cost = getBmpParams();
												
						for (var i=0; i < objectIds.features.length;i++){
							var featureAttributes = objectIds.features[i].attributes;
							//add to the temp list										
							hru_id_list[i] = parseInt(featureAttributes["HRU_ID"]);
						}
						hru_id_list.sort(function(a,b){return a - b});
						
						//get hru_bmp_assigned_list: this list will finally contain data in form <hru_id>,<bmp>. For ex: 30,1 implies bmp 1 selected for hru_id 30
						k = 0;
						for(i=0 ; i < document.getElementById("selected_subbasin_bmp").options.length ; i++){
							var val = (document.getElementById("selected_subbasin_bmp").options[i].value).split(";");
							for(var j=0; j < val.length ;j++){
								hru_bmp_assigned_list[k++] = val[j];
							}
						}
						//sort this list in asc order based on hru_id
						hru_bmp_assigned_list.sort(function(a,b){
							var x = a.split(",");
							var y = b.split(",");
							return x[0] - y[0]
						});
						
						//prepare the final list of BMPs to be sent to the server for BMP evaluation
						//intialize the list: set bmp value to 0
						for(i=0; i < hru_id_list.length; i++){
							hru_bmp_list[i] = 0;
						}
						k = 0;
						for(i=0; i < hru_bmp_assigned_list.length; i++){
							var val = hru_bmp_assigned_list[i].split(",");//hru_id[0] will contain the hru_id
							//alert(val[0]+","+val[1]);
							var found;
							found = 0;
							while(found < 1){
								if(parseInt(hru_id_list[k]) == parseInt(val[0])){
									found = 1;
									hru_bmp_list[k] = val[1];
								}				
								k++;
								if(k > hru_id_list.length){
									alert("Unexpected problem while processing request. Please try again (or) Contact Administrator.");
									return;
								}
							}
						}
						var final_bmp = "";
						for(i=0;i<hru_bmp_list.length-1;i++){
							final_bmp = final_bmp + hru_bmp_list[i] +",";
						}
						final_bmp = final_bmp + hru_bmp_list[hru_bmp_list.length-1];
												
						showMessage("Evaluation Started. Please wait!!!");
						addProgressBar();// show progress bar for user
						//get single simulation data
						document.getElementById("restart").disabled = true;
						$("#main :input").attr("disabled", true);
						$.post("/singlerun",
							{
								is_single_simulation:"1",//simulation type, 1 implies single simulation
								wshIndex:ws, //1:BD , 2:BLC
								listHruBMP:final_bmp, //HRUID,BMP
								cost:final_cost //FS cost,GW cost,CW cost
							},
							function(data,status){//callback function for handling response for POST request
							  //alert("Data: " + data + "\nStatus: " + status);
							  removeProgressBar();
							  document.getElementById("restart").disabled = false;//enable the restart button
							  
							  if(data == "failed"){
								alert("Unable to process your request.Please contact administrator!");
								$("#main :input").attr("disabled", false);								
								return;
							  }
							  else if(data == "in_use"){ //another user is running single simulation
								alert("Another evaluation is in progress at server.Please try after few minutes. If problem persists, please contact system administrator.");
								$("#main :input").attr("disabled", false);								
								return;
							  }
							  else{
								  var splitData = data.split("\n"); //data[0] contains the single simulation results
								  var m = splitData[0].replace(/ /g,",");
								  var n = m.split(",");
								  var p = n.filter(function(e){if(e != "")return true});
								  
								  single_simu_result[0] = parseFloat(p[0]).toFixed(2); //sed absolute value
								  single_simu_result[1] = (((parseFloat(p[1]) - parseFloat(p[0]))/parseFloat(p[1])) * 100).toFixed(2); //p[1] is sed base value ("base" means "with no BMP". Then, calculate sed % red
								  single_simu_result[2] = parseFloat(p[2]).toFixed(2); //this is nitrate reduction's absolute value
								  single_simu_result[3] = (((parseFloat(p[3]) - parseFloat(p[2]))/parseFloat(p[3])) * 100).toFixed(2); // nit % redsingle_simu_result[4] = p[4]; // ph abs value
								  single_simu_result[4] = parseFloat(p[4]).toFixed(2); // ph abs value
								  single_simu_result[5] = (((parseFloat(p[5]) - parseFloat(p[4]))/parseFloat(p[5])) * 100).toFixed(2); //ph % red
								  single_simu_result[6] = parseFloat(p[6]).toFixed(2); // avg abs value
								  single_simu_result[7] = (((parseFloat(p[7]) - parseFloat(p[6]))/parseFloat(p[7])) * 100).toFixed(2); // avg % red
								  single_simu_result[8] = parseFloat(p[8]).toFixed(2); //this is unit cost in usd
								  
								//});//http post ends here*/
								
								//dummy single simu data
								/*single_simu_result[0] = "-80";
								single_simu_result[1] = "50";
								single_simu_result[2] = "-80";
								single_simu_result[3] = "50";
								single_simu_result[4] = "-80";
								single_simu_result[5] = "50";
								single_simu_result[6] = "-80";
								single_simu_result[7] = "50";
								single_simu_result[8] = "110000";
								
								removeProgressBar();*/
								
								//draw chart for pareto optimal data
								if(single_simu_bmp == "-1"){ // this means that multiple BMPs were selected and hence pareto optimal data will not be shown
									alert("INFO: Multiple BMPs were selected for simulation. So, Optimal data will not be displayed!");
									//just display the single simulation results
									drawTable();
								}
								else{
									var optimal_data_nit = new Array();//pareto data for nitrate
									var optimal_data_pho = new Array();//pareto data for phosphorous
									var optimal_pol_red_nit = new Array();//pollutant(nitrate) reduction in the optimal data
									var optimal_pol_red_pho = new Array();//pollutant(phosphorous) reduction in the optimal data
									var optimal_cost_nit = new Array();//optimal cost for nitrate
									var optimal_cost_pho = new Array();//optimal cost for phosphorous
									var supplementaryData = new Array();
									if(document.getElementById("wstype").value == "blc"){
										//this implementation considers only nitrate nutrient for displaying pareto optimal data
										switch(single_simu_bmp){
											case "1":
												//nitrate : use pareto optimal data for FS
												optimal_data_nit = blc_pareto_nit_fs;
												//pho : use pareto optimal data for FS
												optimal_data_pho = blc_pareto_pho_sb;
												break;
											case "2":
												//nitrate : use pareto optimal data for GW
												optimal_data_nit = blc_pareto_nit_gw;
												//pho : use pareto optimal data for GW
												optimal_data_pho = blc_pareto_pho_gw;
												break;
											case "3":
												//nitrate : use pareto optimal data for CW
												optimal_data_nit = blc_pareto_nit_cw;
												//pho : use pareto optimal data for CW
												optimal_data_pho = blc_pareto_pho_cw;
												break;
											case "4":
												//nitrate : use pareto optimal data for BR
												optimal_data_nit = blc_pareto_nit_br;
												//pho : use pareto optimal data for BR
												optimal_data_pho = blc_pareto_pho_br;
												break;
											case "5":
												//nitrate : use pareto optimal data for CC
												optimal_data_nit = blc_pareto_nit_cc;
												//pho : use pareto optimal data for CC
												optimal_data_pho = blc_pareto_pho_cc;
												break;
											case "6":
												//nitrate : use pareto optimal data for DM
												optimal_data_nit = blc_pareto_nit_dm;
												//pho : use pareto optimal data for DM
												optimal_data_pho = blc_pareto_pho_dm;
												break;
											case "7":
												//nitrate : use pareto optimal data for SB
												optimal_data_nit = blc_pareto_nit_sb;
												//pho : use pareto optimal data for SB
												optimal_data_pho = blc_pareto_pho_sb;
												break;
											case "8":
												//nitrate : use pareto optimal data for NM
												optimal_data_nit = blc_pareto_nit_nm;
												//pho : use pareto optimal data for NM
												optimal_data_pho = blc_pareto_pho_nm;
												break;
											case "9":
												//nitrate : use pareto optimal data for PC
												optimal_data_nit = blc_pareto_nit_pc;
												//pho : use pareto optimal data for PC
												optimal_data_pho = blc_pareto_pho_pc;
												break;
										}
									}
									else if(document.getElementById("wstype").value == "bd"){
										//this implementation considers only nitrate and phosphorous nutrients for displaying pareto optimal data
										switch(single_simu_bmp){
											case "1":
												//nitrate : use pareto optimal data for FS
												optimal_data_nit = bd_pareto_nit_fs;
												//pho : use pareto optimal data for FS
												optimal_data_pho = bd_pareto_pho_sb;
												break;
											case "2":
												//nitrate : use pareto optimal data for GW
												optimal_data_nit = bd_pareto_nit_gw;
												//pho : use pareto optimal data for GW
												optimal_data_pho = bd_pareto_pho_gw;
												break;
											case "3":
												//nitrate : use pareto optimal data for CW
												optimal_data_nit = bd_pareto_nit_cw;
												//pho : use pareto optimal data for CW
												optimal_data_pho = bd_pareto_pho_cw;
												break;
											case "4":
												//nitrate : use pareto optimal data for BR
												optimal_data_nit = bd_pareto_nit_br;
												//pho : use pareto optimal data for BR
												optimal_data_pho = bd_pareto_pho_br;
												break;
											case "5":
												//nitrate : use pareto optimal data for CC
												optimal_data_nit = bd_pareto_nit_cc;
												//pho : use pareto optimal data for CC
												optimal_data_pho = bd_pareto_pho_cc;
												break;
											case "6":
												//nitrate : use pareto optimal data for DM
												optimal_data_nit = bd_pareto_nit_dm;
												//pho : use pareto optimal data for DM
												optimal_data_pho = bd_pareto_pho_dm;
												break;
											case "7":
												//nitrate : use pareto optimal data for SB
												optimal_data_nit = bd_pareto_nit_sb;
												//pho : use pareto optimal data for SB
												optimal_data_pho = bd_pareto_pho_sb;
												break;
											case "8":
												//nitrate : use pareto optimal data for NM
												optimal_data_nit = bd_pareto_nit_nm;
												//pho : use pareto optimal data for NM
												optimal_data_pho = bd_pareto_pho_nm;
												break;
											case "9":
												//nitrate : use pareto optimal data for PC
												optimal_data_nit = bd_pareto_nit_pc;
												//pho : use pareto optimal data for PC
												optimal_data_pho = bd_pareto_pho_pc;
												break;
										}
									}
									for(i=1 ;i<optimal_data_nit.length ; i++){
										if (optimal_data_nit[i].replace(/ /g,"") == "") {
											continue;
										}
										
										var temp0 = optimal_data_nit[i].replace(/ /g,",");
										var temp = temp0.split(",");
										var temp1 = temp.filter(function(e){if(e != "")return true});
										var temp2 = new Array();
										optimal_pol_red_nit.push(temp1[368]);optimal_cost_nit.push(temp1[369]);
										
										temp2.push(temp1[370]);
										temp2.push(temp1[371]);
										temp2.push(temp1[372]);
										temp2.push(temp1[373]);
										supplementaryData.push(temp2);
									}
									for(i=1 ;i<optimal_data_pho.length ; i++){
										if (optimal_data_pho[i].replace(/ /g,"") == "") {
											continue;
										}
										
										var temp0 = optimal_data_pho[i].replace(/ /g,",");
										var temp = temp0.split(",");
										var temp1 = temp.filter(function(e){if(e != "")return true});
										var temp2 = new Array();
										optimal_pol_red_pho.push(temp1[368]);optimal_cost_pho.push(temp1[369]);
										
										temp2.push(temp1[370]);
										temp2.push(temp1[371]);
										temp2.push(temp1[372]);
										temp2.push(temp1[373]);
										supplementaryData.push(temp2);
									}

									//when we come here, we know that it is a single bmp evaluation. So, single_simu_bmp contains the bmp code (1 or 2 or 3)
									//get the cost for the selected BMP and send it to drawChart for scaling the pareto optimal cost
									var temp_cost;
									switch(single_simu_bmp){
										case "1":
											temp_cost = final_cost.split(";")[0];
											break;
										case "2":
											temp_cost = final_cost.split(";")[1];
											break;
										case "3":
											temp_cost = final_cost.split(";")[2];
											break;
										case "4":
											temp_cost = final_cost.split(";")[3];
											break;
										case "5":
											temp_cost = (final_cost.split(";")[4]).split(",")[0];
											break;
										case "6":
											temp_cost = final_cost.split(";")[5];
											break;
										case "7":
											temp_cost = final_cost.split(";")[6];
											break;
										case "8":
											a = (final_cost.split(";")[7]).split(",");
											temp_cost = ( parseFloat(a[0]) + parseFloat(a[1]) + parseFloat(a[2]) + parseFloat(a[3]) ) / 4;
											break;
										case "9":
											temp_cost = (final_cost.split(";")[8]).split(",")[0];
											break;
									}
									
									//draw the consolidated results table
									drawTable(single_simu_bmp);
									
									//draw the chart for nitrate
									drawChart(optimal_pol_red_nit,optimal_cost_nit,single_simu_result[3],single_simu_result[8],temp_cost,"Nitrate",single_simu_bmp,supplementaryData);
									
									/************************Initially, it was decided to show phosphorous graph plot. After development,it was decided not to show it***********************/
									/*draw the chart for phosphorous
									 * BMPs 4-BR,7-SB,6-DM does not give any phosphorous reduction.
									 * So, do not display phosphorous result for these BMPs
									*/
									/*if(displayConstraint(single_simu_bmp)){
										drawChart(optimal_pol_red_pho,optimal_cost_pho,single_simu_result[5],single_simu_result[8],temp_cost,"Phosphorous");
									}*/
									/************************Initially, it was decided to show phosphorous graph plot. After development,it was decided not to show it***********************/
									
									//clear hru_layers from map
									for(i=1; i <= hrulayer_id; i++){
										map.removeLayer(map.getLayer(i));
									}
									//get hru selected by user for bmp evaluation
									//this value will be passed to mark_hru_chart
									var user_hru = "";
									for(i=0; i < hru_bmp_assigned_list.length; i++){
										var val = hru_bmp_assigned_list[i].split(",");//[0] will contain the hru_id
										if(user_hru == "") user_hru = val[0];
										else user_hru = user_hru + "," + val[0];
									}
									//add these hru_layers with map layer id "1"
									var hru_layer = new esri.layers.FeatureLayer(hru_url,{id:"1"});
									hru_layer.setDefinitionExpression("HRU_ID IN ("+user_hru+")");
									map.addLayer(hru_layer);
									
									//collect hru_ids into chart_hru_id for each optimal point
									//we need this to show these hru_id in map when user selects a point in the chart
									mark_hru_chart(optimal_data_nit,hru_id_list,user_hru,"Nitrate");
									mark_hru_chart(optimal_data_pho,hru_id_list,user_hru,"Phosphorous");									
								}
							}//else ends here
							  
							//draw table for showing the subbasin level results
							drawTableSubBasinReduction(data);
						});//http post ends here*/				
						
					}, function(errorMsg){
						alert("Error while fetching HRU IDs:"+errorMsg);
						return "";
					}
				);//queryTask ends here
			}
		);
	  });//click function ends here
	});//document ready function ends here
	
	//collect HRU_IDs for each entry in optimal_data
	//this list is used for showing the HRU_IDs on the map, when the user clicks on a point in the graph
	function mark_hru_chart(optimal_data,hru_id_list,user_hru,nutrientType){
		var i;
		var j;
		for(i=0 ;i<optimal_data.length ; i++){
			var hru_id;
			var temp0 = optimal_data[i].replace(/ /g,",");//replace all spaces with comma
			var temp = temp0.split(",");
			var temp1 = temp.filter(function(e){if(e != "")return true});//remove all empty elements
			hru_id= "";
			for(j=0 ;j<368 ; j++){ //last 2 elements in temp1 are pollu_red and cost which we do not want
				if(temp1[j] != "0"){ //value "0" means that the HRU_ID was not selected for BMP,so ignore it
					if(hru_id == "") hru_id = hru_id_list[j];
					else hru_id = hru_id + "," + hru_id_list[j];
				}
			}
			if(nutrientType == "Nitrate"){
				chart_hru_id_nit[i] = hru_id;//set the HRU_IDs in the pareto optimal data to the chart_hru_id list
			}
			else if(nutrientType == "Phosphorous"){
				chart_hru_id_pho[i] = hru_id;//set the HRU_IDs in the pareto optimal data to the chart_hru_id list
			}
		}
		
		if(nutrientType == "Nitrate"){
			chart_hru_id_nit[i] = user_hru; //user selected HRUs
		}
		else if(nutrientType == "Phosphorous"){
			chart_hru_id_pho[i] = user_hru; //user selected HRUs
		}
	}
	
	//Display single simulation results in a table
	function drawTable(bmp_id){
		var para0=document.createElement("p");
		var node0=document.createTextNode("Watershed level BMP Evaluation Result - Cost : "+single_simu_result[8]+" USD");
		para0.appendChild(node0);
		para0.className="thick";
		
		var tab=document.createElement('table');
		var tbo=document.createElement('tbody');
		var row, cell;		
		
		//Heading
		row=document.createElement('tr');
		cell=document.createElement('th');
		cell.appendChild(document.createTextNode("Nutrient"));
		row.appendChild(cell);
		cell=document.createElement('th');
		cell.appendChild(document.createTextNode("Reduction Value"));
		row.appendChild(cell);
		cell=document.createElement('th');
		cell.appendChild(document.createTextNode("% Reduction"));
		row.appendChild(cell);
		tbo.appendChild(row);
		
		/*
		 * Do not display Pho and Sediment results for BR/SB/DM
		 */
		if(displayConstraint(bmp_id)){
			//Sediment results
			row=document.createElement('tr');
			cell=document.createElement('td');
			cell.appendChild(document.createTextNode("Sediment"));
			row.appendChild(cell);
			cell=document.createElement('td');
			cell.appendChild(document.createTextNode(single_simu_result[0] + " metric tons / day"));
			row.appendChild(cell);
			cell=document.createElement('td');
			cell.appendChild(document.createTextNode(single_simu_result[1]));
			row.appendChild(cell);
			tbo.appendChild(row);
			
			//Phosphorous results
			row=document.createElement('tr');
			cell=document.createElement('td');
			cell.appendChild(document.createTextNode("Phosphorous"));
			row.appendChild(cell);
			cell=document.createElement('td');
			cell.appendChild(document.createTextNode(single_simu_result[4] + " kg / day"));
			row.appendChild(cell);
			cell=document.createElement('td');
			cell.appendChild(document.createTextNode(single_simu_result[5]));
			row.appendChild(cell);
			tbo.appendChild(row);
		}
		
		//Nitrate results
		row=document.createElement('tr');
		cell=document.createElement('td');
		cell.appendChild(document.createTextNode("Nitrate"));
		row.appendChild(cell);
		cell=document.createElement('td');
		cell.appendChild(document.createTextNode(single_simu_result[2] + " kg / day"));
		row.appendChild(cell);
		cell=document.createElement('td');
		cell.appendChild(document.createTextNode(single_simu_result[3]));
		row.appendChild(cell);
		tbo.appendChild(row);
		
		
		tab.appendChild(tbo);
		tab.className="bmptable";
		
		var element=document.getElementById("bmp_table");
		element.appendChild(para0);
		element.appendChild(tab);
		
		$("#checkBMPTable").show();
	}
	
	//draw table to show sub basin level evaluation results
	function drawTableSubBasinReduction(ocm_data){
		var ocm_result = ocm_data.split("\n");
		var selected_subbasins = new Array(); 
		var j = 0;
		//collect all selected subbasins
		for(i=0 ; i < document.getElementById("selected_subbasin_temp").options.length ; i++){
			selected_subbasins[j++] = document.getElementById("selected_subbasin_temp").options[i].value;
		}
		//draw a table
		var para0=document.createElement("p");
		var node0=document.createTextNode("Subbasin level BMP Evaluation Result");
		para0.appendChild(node0);
		para0.className="thick";
		
		var tab=document.createElement('table');
		var tbo=document.createElement('tbody');
		var row, cell;		
		
		//Heading
		row=document.createElement('tr');
		cell=document.createElement('th');
		cell.appendChild(document.createTextNode("Subbasin ID"));
		row.appendChild(cell);
		cell=document.createElement('th');
		cell.appendChild(document.createTextNode("Nitrate % Reduction"));
		row.appendChild(cell);
		cell=document.createElement('th');
		cell.appendChild(document.createTextNode("Phosphorous % Reduction"));
		row.appendChild(cell);
		cell=document.createElement('th');
		cell.appendChild(document.createTextNode("Sediment % Reduction"));
		row.appendChild(cell);
		tbo.appendChild(row);
		//draw table ends
		
		for(i=0; i < selected_subbasins.length; i++){
			/*
			 * ocm_result[0] contains the single simulation results
			 * ocm_result[1] contains the heading "subbasin id, sediment red %, nitrate red %, phosphorous red %"
			 * skip above 2 entries and so +1 below for finding temp
			 */
			var a = ocm_result[parseInt(selected_subbasins[i]) + 1];
			if(a){
				//var temp = ocm_result[parseInt(selected_subbasins[i]) + 1].split(" ");
				var temp = a.split(" ");
				/*temp[0] : subbasin id
				temp[1] : sediment % red
				temp[2] : nit % red
				temp[3] : pho % red*/
				row=document.createElement('tr');
				cell=document.createElement('td');
				cell.appendChild(document.createTextNode(temp[0]));
				row.appendChild(cell);
				cell=document.createElement('td');
				cell.appendChild(document.createTextNode(temp[2]));
				row.appendChild(cell);
				cell=document.createElement('td');
				cell.appendChild(document.createTextNode(temp[3]));
				row.appendChild(cell);
				cell=document.createElement('td');
				cell.appendChild(document.createTextNode(temp[1]));
				row.appendChild(cell);
				tbo.appendChild(row);
			}
		}
		
		tab.appendChild(tbo);
		tab.className="bmptable";
		
		//an empty line just for cosmetic
		var para1=document.createElement("p");
		var node1=document.createTextNode("");
		para1.appendChild(node1);
		
		var element=document.getElementById("bmp_table");
		element.appendChild(para0);
		element.appendChild(tab);
		element.appendChild(para1);
		
	}
	
	//Functions for drawing Charts
	// pol_red : array for pollutant reduction - pareto optimal data
	//cost : array for cost - pareto optimal data
	//single_simu_red : pollutant reduction - single simulation
	//single_simu_cost : cost - single simulation
	//user_cost : the cost entered by user for the BMP. This will be used to scale the unit cost used for the pareto optimal data
	function drawChart(pol_red,cost,single_simu_red,single_simu_cost,user_cost,nutrientType,single_simu_bmp,supplementaryData){

		//var cost = new Array(); //array for costs
		//var pol_red = new Array(); //array for pollutant reduction
		var hru_ids = new Array(); //array for hru_ids for a corresponding cost/pol_red value
		var divID; //Id of <div> based on nutrientType
		if(nutrientType == "Nitrate"){
			divID = "bmp_chart_nit";
		}
		else if(nutrientType == "Phosphorous"){
			divID = "bmp_chart_pho";
		}
		
		//testing purpose: pareto optimal data
		/*for(i=0 ;i<5 ;i++){
			cost[i] = i*10;
			pol_red[i] = i*20;
			hru_ids[i] = "10,10,20,30";
		}
		//testing purpose: single evaluation data
		cost[5] = 23;pol_red[5] = 63;*/
		
		//create the data table
		var data = new google.visualization.DataTable();
		// Add columns
		data.addColumn('number', 'PercReduction'); //x-axis
		data.addColumn('number', 'Cost'); //y-axis
		data.addColumn({type:'string', role:'tooltip'}); //tooltip
		data.addColumn('number', 'Evaluation');
		data.addColumn({type:'string', role:'tooltip'});
		data.addColumn({type:'string', role:'annotation'});
		//Add number of rows required for the chart
		data.addRows(pol_red.length + 1); //+1 is for adding single simuation result
		// Add pareto optimal data
		for(i=0 ;i < pol_red.length ;i++){
			data.setCell(i,0,parseFloat(pol_red[i]));
			
			/*
			 * For Nutrient Management BMP , the pareto cost is not unit cost.
			 * So, the scaling is done with the ratio (user_cost / pareto_cost for NM)
			 * This pareto_cost for NM is hard coded here and should be updated if changed while evaluating the pareto data
			 * 
			 *  For all other BMPs, the pareto cost is unit cost
			 *  So, we just scale it up with the user_cost
			 */
			if(single_simu_bmp == "8"){
				data.setCell(i,1,(parseFloat(cost[i])*user_cost)/840);
				data.setCell(i,2,nutrientType+" Reduction: "+parseFloat(pol_red[i]).toFixed(2)+" %, Cost: "+((parseFloat(cost[i])*user_cost)/840).toFixed(2)+" USD");
			}
			else{
				data.setCell(i,1,parseFloat(cost[i])*user_cost); //pareto cost needs to be scaled with the user entered cost
				data.setCell(i,2,nutrientType+" Reduction: "+parseFloat(pol_red[i]).toFixed(2)+" %, Cost: "+(parseFloat(cost[i])*user_cost).toFixed(2)+" USD");
			}
			//alert(parseInt(cost[i])+":"+pol_red[i]);
		}		
		//Add single evaluation data in the last row of the datatable
		data.setCell(pol_red.length,0,parseFloat(single_simu_red));
		data.setCell(pol_red.length,3,parseFloat(single_simu_cost));		
		data.setCell(pol_red.length,4,nutrientType+" Reduction: "+parseFloat(single_simu_red)+"%, Cost: "+parseFloat(single_simu_cost)+" USD");
		data.setCell(pol_red.length,5,nutrientType+" Reduction for BMP Evaluation");
		
		//var options = {title:'BMP Evaluation Chart',legend:{position:'none'},
		//no legend for nitrate graph: just for space adjustment in the user interface
		var options;
		if(nutrientType == "Nitrate"){
			options ={title:'BMP Evaluation Chart - '+nutrientType+' Reduction',
						align: 'center',
						vAxis: {title: 'BMP Cost (USD)'},
						hAxis: {title: nutrientType+' Reduction (%)'},
						//legend:{position:'none'} //if you don't want the legend then uncomment this attribute
					};
		}
		else if(nutrientType == "Phosphorous"){
			options ={title:'BMP Evaluation Chart - '+nutrientType+' Reduction',
						vAxis: {title: 'BMP Cost (USD)'},
						hAxis: {title: nutrientType+' Reduction (%)'}
					};
		}
		
		// The select handler. Call the chart's getSelection() method
		// call back method for the user selection of points in the chart
		// need to dsplay the HRUs in the map which correspond to the value selected in the graph
		selectHandler = function(selectedItem) {
			if (selectedItem) {
				//from here on, we will have only one HRU Feature layer on the map
				//this layer will be tagged with ID "1"
				//remove the already existing layer created in function for "evaluate" button click
				map.removeLayer(map.getLayer("1"));
				
				//create a map layer for displaying selected HRUs				
				if(document.getElementById("wstype").value == "blc"){
					hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/3";
				}
				else if(document.getElementById("wstype").value == "bd"){
					hru_url = "http://gismaps.sws.uiuc.edu/ArcGIS/rest/services/UpperSangBMP/MapServer/7";
				}	
				var hru_layer = new esri.layers.FeatureLayer(hru_url,{id:"1"});
				if(nutrientType == "Nitrate"){
					hru_layer.setDefinitionExpression("HRU_ID IN ("+chart_hru_id_nit[selectedItem]+")");
				}
				else if(nutrientType == "Phosphorous"){
					hru_layer.setDefinitionExpression("HRU_ID IN ("+chart_hru_id_pho[selectedItem]+")");
				}
				map.addLayer(hru_layer);
			}
		}
		
		//Use Google's ScatterChart
		var chart = new google.visualization.ScatterChart(document.getElementById(divID));//global variable for chart
		google.visualization.events.addListener(chart, 'select', selectHandler);
		chart.draw(data, options);
		
		var dataHOptimal = [];
		var dataHEvaluation = [];
		for (var i=0; i<pol_red.length; i++) {
			var temp = [];
			temp.push(parseFloat(pol_red[i]));
			temp.push(parseFloat(cost[i]));
			temp.push(supplementaryData[i][0]);
			temp.push(supplementaryData[i][1]);
			temp.push(supplementaryData[i][2]);
			temp.push(supplementaryData[i][3]);
			dataHOptimal.push(temp);
		}
		
		var temp = [];
		temp.push(parseFloat(single_simu_red));
		temp.push(parseFloat(single_simu_cost));
		dataHEvaluation.push(temp);
		
		plotHighChart(dataHOptimal, dataHEvaluation, nutrientType, user_cost);
	}
	
	function prepare(dataArray) {
	    return dataArray.map(function (item, index) {
	        return {x: item[0], y: item[1], myIndex: index, nitratePercentage: item[0], equalAnnualCost: item[1], bmpTreatmentArea: item[2], bmpScenarioId: item[3], tp: item[4], sed:item[5]};
	    });
	};
	
	function prepareUserNormalizedOptimal(dataArray, user_cost) {
	    return dataArray.map(function (item, index) {
	        return {x: item[0], y: (item[1] * user_cost / 66.7), myIndex: index, nitratePercentage: item[0], equalAnnualCost: (item[1] * user_cost / 66.7), bmpTreatmentArea: item[2], bmpScenarioId: item[3], tp: item[4], sed:item[5]};
	    });
	};
	
	function plotHighChart(dataHOptimal, dataHEvaluation, nutrientType, user_cost)
	{
		dataHOptimalUnmodified = prepare(dataHOptimal);
		dataHOptimalNormalized = prepareUserNormalizedOptimal(dataHOptimal, user_cost);
		
		$(function () {
	        $('#bmp_chart_temp').highcharts({
	            chart: {
	                type: 'scatter',
	                zoomType: 'xy'
	            },
	            title: {
	                text: "BMP Evaluation Chart - " + nutrientType + " Reduction",
	                style: {
	                	fontSize : '25px'
	                }
	            },
	            xAxis: {
	                title: {
	                    enabled: true,
	                    text: nutrientType +' Reduction (%)',
	                    style: {
	                    	fontSize : '20px'
	                    }
	                },
	                gridLineWidth: 1
	            },
	            yAxis: {
	                title: {
	                    text: 'BMP Cost (USD)',
	                    style: {
	                    	fontSize : '20px'
	                    }
	                }
	            },
	            legend: {
	            	style: {
	            		fontSize : '20px'
	            	}
	            },
	            plotOptions: {
	                scatter: {
	                    marker: {
	                        radius: 5,
	                        states: {
	                            hover: {
	                                enabled: true,
	                                lineColor: 'rgb(100,100,100)'
	                            }
	                        }
	                    },
	                    states: {
	                        hover: {
	                            marker: {
	                                enabled: false
	                            }
	                        }
	                    },
	                    tooltip: {
	                        headerFormat: '<b>{series.name}</b><br>',
	                        pointFormat: nutrientType +' Reduction : {point.x} %, Cost : {point.y} USD'
	                    }
	                },
                    series: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                	selectHandler(this.myIndex);
                                	$('#supplementary_information').show();
                                	$('#supplementary_information tr:last').remove();
                                	$('#supplementary_information tr:last').after('<tr><td align="center">' + this.bmpScenarioId + '</td>' +
                                			'<td align="center">' + this.bmpTreatmentArea + '</td>' +
                                			'<td align="center">' + this.nitratePercentage + '</td>' +
                                			'<td align="center">' + this.tp + '</td>' +
                                			'<td align="center">' + this.sed + '</td>' +
                                			'<td align="center">' + this.equalAnnualCost + '</td></tr>');
                                }
                            }
                        }
                    }
	            },
	            series: [{
	                name: 'Optimal',
	                color: 'rgba(0 , 0, 255, 0.9)',
	                data: dataHOptimalUnmodified
	    
	            }, {
	                name: 'Optimal normalized by user value',
	                color: 'rgba(0 , 0, 0, 0.9)',
	                data: dataHOptimalNormalized
	    
	            }, {
	                name: 'Evaluation',
	                color: 'rgba(255 , 140, 0, 1)',
	                data: dataHEvaluation
	            }]
	        });
	    });
	}
	
	//Just a warning message that pareto optimal data will not be shown for multiple BMP selection
	function paretoWarning(){
		if(document.getElementById("bmp").value != "default"){
			showMessage("Warning: If multiple BMPs are selected for evaluation, then optimal data will not be displayed in the evaluation results!");
		}
		
		bmpParamDisplayOff();
		
		if(document.getElementById("bmp").value == "default"){
			return;
		}
				
		if(document.getElementById("bmp").value == "5"){			
			document.getElementById("bmp_params_cc").style.display="block";
		}
		else if(document.getElementById("bmp").value == "9"){
			document.getElementById("bmp_params_pc").style.display="block";
		}
		else if(document.getElementById("bmp").value == "8"){
			document.getElementById("bmp_params_nm").style.display="block";
		}
		else if(document.getElementById("bmp").value == "1"){
			document.getElementById("bmp_params_fs").style.display="block";
		}
		else if(document.getElementById("bmp").value == "2"){
			document.getElementById("bmp_params_gw").style.display="block";
		}
		else if(document.getElementById("bmp").value == "3"){
			document.getElementById("bmp_params_cw").style.display="block";
		}
		else if(document.getElementById("bmp").value == "4"){
			document.getElementById("bmp_params_br").style.display="block";
		}
		else if(document.getElementById("bmp").value == "6"){
			document.getElementById("bmp_params_dm").style.display="block";
		}		
		else if(document.getElementById("bmp").value == "7"){
			document.getElementById("bmp_params_sb").style.display="block";
		}
	}
	
	function addProgressBar(){
		$("#bmp_progress").css('margin-left', '200px');
		$("#bmp_progress").css('margin-top', '200px');
		
//		$( "#bmp_progress" ).progressbar({
//	        value: false
//	    });
		
		window.percentProgressBar = 0;
		incrementProgressCount();
	}
	
	function incrementProgressCount()
	{
		if (window.percentProgressBar == 100) {
			$( "#bmp_progress").progressbar({
		        value: 100
		    });
			removeProgressBarDivAssociatedData();
			return;
		}
		
		$( "#bmp_progress" ).progressbar({
	        value: window.percentProgressBar
	    });
		
		if (window.percentProgressBar < 99) {
			window.percentProgressBar = window.percentProgressBar + 1;
			setTimeout(incrementProgressCount, 1200);
		}
	}
	
	function removeProgressBar(){
		window.percentProgressBar = 100;
		incrementProgressCount();
	}
	
	function removeProgressBarDivAssociatedData()
	{
		$("#bmp_progress").progressbar("destroy");
		$("#bmp_progress").css('margin-left', '0px');
		$("#bmp_progress").css('margin-top', '0px');
	}
	
	//check on keypress if is a digit
	function isNumberKey(evt)
    {
       var charCode = (evt.which) ? evt.which : event.keyCode
       if (charCode > 31 && (charCode < 48 || charCode > 57)){
          return false;
       }
       return true;
    }
	
	//check on keypress if it is a float
	function isFloatValue(e,obj)
    {
		if ([e.keyCode||e.which]==8) //this is to allow backspace
			return true;
		if ([e.keyCode||e.which]==46) {
	        var val = obj.value;
	        if(val.indexOf(".") > -1)
	        {
	            e.returnValue = false;
	            return false;
	        }
	        return true;
	    }
		
	   var charCode = (e.which) ? e.which : event.keyCode
       if (charCode > 31 && (charCode < 48 || charCode > 57)){
          return false;
       }
       return true;
    }
	
	/*
	 * Validate the before and after planting ratios for the NM parameters
	 * Both ratios should be between 0 and 1
	 * The sum of the ratios should not exceed 1
	 * 
	 * When both ratios are entered, give a message to user about the fall/winter planting ratios
	 * fall/winter planting ratio = 1 - before planting ratio - after planting ratio 
	 */
	function validateRatio(obj){
		if(obj.value == ""){
			return;
		}
		else if(parseFloat(obj.value) < 0.2 || parseFloat(obj.value) > 0.5){
			alert("Planting ratio should be between 0.2 and 0.5");
			obj.value = "";
			obj.focus();
		}
		
		var ratio1 = document.getElementById("bmp_params_nm_ratio1").value;
		var ratio2 = document.getElementById("bmp_params_nm_ratio2").value;
		
		if(ratio1 != "" && ratio2 != ""){
			if(parseFloat(ratio1) + parseFloat(ratio2) > 1){
				alert("Sum of before and after planting ratios cannot be greater than 1.");
				obj.value = "";
				return;
			}
			else{
				alert("Fall/Winter planting ratio will be : " + Math.floor((1 - (parseFloat(ratio1) + parseFloat(ratio2)))*100)/100);
				return;
			}
		}
		
	}
	
	/*
	 * Download reports in txt/csv formats
	 */
	function downloadReport(){
		var ws = $("#wstype").val();
		var type = $("#reportFileType").val();
		url = "http://swscypress3:4567/downloadReport?wshIndex="+ws+"&"+"fileType="+type;
		
		$.get("/downloadReport",
				{
					wshIndex:ws, //bd:BD , blc:BLC
					fileType:type
				},
				function(data,status){
					window.location = url;
				}
		);
	}

	//hide the hru,lu,soils report links
	function hideReportLinks(){
		document.getElementById("bd_report").style.display="none";
		document.getElementById("blc_report").style.display="none";
	}
	
	/*
	 * select HRUs to match user entered percentage
	 */
	function selectHRU(){
		var perc = $("#hru_percent").val();
		var perc_temp = 0;
		
		if(perc == "") return;
		if(parseFloat(perc) == 0) return;

		$("#hru_info_temp_select > option").each(function() {
			$(this).attr('selected', false);
			if(parseFloat(perc_temp) <  parseFloat(perc)) {
				perc_temp = parseFloat(perc_temp) + parseFloat($(this).attr('percent'));
				$(this).attr('selected', true);
			}
		});
		
		$("#hru_info_temp_select").trigger("chosen:updated");
	}
	
	/* BMPs 4-BR,7-SB,6-DM does not give any phosphorous reduction.
	 * So, do not display phosphorous result for these BMPs.
	*/
	function displayConstraint(bmp_id){
		if(bmp_id == "4" || bmp_id == "7" || bmp_id == "6"){
			return false;
		}
		return true;
	}
	
	/*
	 * load data when the page loads
	 */
	function loadData(){
		loadParetoData();
		loadConstraints();
		
	}
	
	/*
	* the display for th bmp parameters are off 
	*/
	function bmpParamDisplayOff(){
		document.getElementById("bmp_params_cc").style.display="none";
		document.getElementById("bmp_params_pc").style.display="none";
		document.getElementById("bmp_params_nm").style.display="none";
		document.getElementById("bmp_params_fs").style.display="none";	
		document.getElementById("bmp_params_gw").style.display="none";	
		document.getElementById("bmp_params_cw").style.display="none";	
		document.getElementById("bmp_params_br").style.display="none";	
		document.getElementById("bmp_params_dm").style.display="none";	
		document.getElementById("bmp_params_sb").style.display="none";	
	}
	
	/*
	 * The BMP Parameters that should be sent to the OCM model
	 * Format is as show below:
	 * fs_cost;
	 * gw_cost;
	 * cw_cost;
	 * br_cost;
	 * cc_cost,cc_type;
	 * dm_cost;
	 * sb_cost;
	 * nm_cost1,nm_cost2,nm_cost3,nm_cost4,nm_rate,nm_ratio1,nm_ratio2;
	 * pc_cost,pc_type
	 */
	function getBmpParams(){
		var output = "";
		output = bmp_param_fs_cost + ";" +
				 bmp_param_gw_cost + ";" +
				bmp_param_cw_cost + ";" +
				bmp_param_br_cost + ";" +
				bmp_param_cc_cost + "," + bmp_param_cc_type + ";" +
				bmp_param_dm_cost + ";" +
				bmp_param_sb_cost + ";" +
				bmp_param_nm_cost1 + "," + bmp_param_nm_cost2 + "," + bmp_param_nm_cost3 + "," + bmp_param_nm_cost4 + "," +	bmp_param_nm_rate + "," + bmp_param_nm_ratio1 + "," + bmp_param_nm_ratio2 + ";" +
				bmp_param_pc_cost + "," + bmp_param_pc_type;
		return output;
	}
	
	/*
	 * Elemental Nitrogen cost  = 0.82 * Anhydrous Ammonia Cost
	*/
	function computeEleN2(obj){
		if(obj.value == ""){
			document.getElementById("bmp_params_nm_cost1").value = "";
			return;
		}
		document.getElementById("bmp_params_nm_cost1").value = Math.floor(parseFloat(obj.value) * 0.82 * 100) / 100 ;		
	}
	
	/*
	* NM BMP Parameter : Fertilizer Application rate must be > 155 lb/ha and < 189 lb/ha.
	*/
	function validateFertRate(obj){
		if(obj.value == "") return;
		if(parseFloat(obj.value) < 155 || parseFloat(obj.value) > 189){
			alert("Fertilizer Application Rate must be > 155 lb/ha and < 189 lb/ha.");
			obj.value = "";
			obj.focus();
		}
	}