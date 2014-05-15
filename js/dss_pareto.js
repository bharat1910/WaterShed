	//Arrays for pareto optimal data
	//<Watershed>_pareto_<nutrientType>_<bmp>
	//Big Ditch / Nitrate
	var bd_pareto_nit_fs = new Array();
	var bd_pareto_nit_gw = new Array();
	var bd_pareto_nit_cw = new Array();
	var bd_pareto_nit_br = new Array();
	var bd_pareto_nit_cc = new Array();
	var bd_pareto_nit_cr = new Array();
	var bd_pareto_nit_rg = new Array();
	var bd_pareto_nit_dwm = new Array();
	var bd_pareto_nit_sb = new Array();
	var bd_pareto_nit_nm = new Array();
	var bd_pareto_nit_aa = new Array();
	
	//Arrays for pareto optimal data
	//<Watershed>_pareto_<nutrientType>_<bmp>
	//Big Ditch / Phosphorous
	var bd_pareto_pho_fs = new Array();
	var bd_pareto_pho_gw = new Array();
	var bd_pareto_pho_cw = new Array();
	var bd_pareto_pho_br = new Array();
	var bd_pareto_pho_cc = new Array();
	var bd_pareto_pho_cr = new Array();
	var bd_pareto_pho_rg = new Array();
	var bd_pareto_pho_dwm = new Array();
	var bd_pareto_pho_sb = new Array();
	var bd_pareto_pho_nm = new Array();
	var bd_pareto_pho_aa = new Array();
	
	//Arrays for pareto optimal data
	//<Watershed>_pareto_<nutrientType>_<bmp>
	//Big Long Creek / Nitrate
	var blc_pareto_nit_fs = new Array();
	var blc_pareto_nit_gw = new Array();
	var blc_pareto_nit_cw = new Array();
	var blc_pareto_nit_br = new Array();
	var blc_pareto_nit_cc = new Array();
	var blc_pareto_nit_cr = new Array();
	var blc_pareto_nit_rg = new Array();
	var blc_pareto_nit_dwm = new Array();
	var blc_pareto_nit_sb = new Array();
	var blc_pareto_nit_nm = new Array();
	var blc_pareto_nit_aa = new Array();
	
	//Arrays for pareto optimal data
	//<Watershed>_pareto_<nutrientType>_<bmp>
	//Big Long Creek / Phosphorous
	var blc_pareto_pho_fs = new Array();
	var blc_pareto_pho_gw = new Array();
	var blc_pareto_pho_cw = new Array();
	var blc_pareto_pho_br = new Array();
	var blc_pareto_pho_cc = new Array();
	var blc_pareto_pho_cr = new Array();
	var blc_pareto_pho_rg = new Array();
	var blc_pareto_pho_dwm = new Array();
	var blc_pareto_pho_sb = new Array();
	var blc_pareto_pho_nm = new Array();
	var blc_pareto_pho_aa = new Array();
	
	//Load all pareto data for the "watershed X nutrient X BMP" combinations
	//For instance, bigDitch_nitrate_filterStrip is one scuh combination
	
	function loadParetoData(){
		
		//This method is called onload. Hide the report links
		hideReportLinks();
		
		var index;
		//Currently, there are 9 BMPs
		//so, iterate 9 times to read all pareto data
		for(index = 1 ; index < 10 ; index++){
			//for big ditch
			readParetoFile("bigDitch","nitrate",index);
			readParetoFile("bigDitch","phosphorous",index);
			//for big long creek
			readParetoFile("bigLongCreek","nitrate",index);
			readParetoFile("bigLongCreek","phosphorous",index);
		}
	}
	
	function readParetoFile(waterShed,nutrient,bmpIndex){
		var fileName = "";
		//identify the global array to store pareto data
		//fileName also can be used instead of paretoArrayName
		//but we decide to use paretoArrayName so that the array names
		//and filenames(that are maintained outside this code) are not coupled.
		var paretoArrayName = "";
		
		switch(waterShed){
			case "bigDitch":
				fileName = "bd";
				paretoArrayName = "bd_pareto";
				break;
			case "bigLongCreek":
				fileName = "blc";
				paretoArrayName = "blc_pareto";
				break;
		}
		switch(nutrient){
			case "nitrate":
				fileName = fileName + "_nit";
				paretoArrayName = paretoArrayName + "_nit";
				break;
			case "phosphorous":
				fileName = fileName + "_pho";
				paretoArrayName = paretoArrayName + "_pho";
				break;
		}
		
		fileName = fileName + "_pareto"
		
		switch(bmpIndex){
			case 1:
				fileName = fileName + "_FS.txt";
				paretoArrayName = paretoArrayName + "_fs";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
			case 2:
				fileName = fileName + "_GW.txt";
				paretoArrayName = paretoArrayName + "_gw";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
			case 3:
				fileName = fileName + "_CW.txt";
				paretoArrayName = paretoArrayName + "_cw";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
			case 4:
				fileName = fileName + "_BR.txt";
				paretoArrayName = paretoArrayName + "_br";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
			case 5:
				fileName_temp = fileName + "_CC.txt";
				paretoArrayName_temp = paretoArrayName + "_cc";
				getParetoData(waterShed,nutrient,fileName_temp,paretoArrayName_temp);
				
				fileName_temp = fileName + "_CR.txt";
				paretoArrayName_temp = paretoArrayName + "_cr";
				getParetoData(waterShed,nutrient,fileName_temp,paretoArrayName_temp);
				
				fileName_temp = fileName + "_RG.txt";
				paretoArrayName_temp = paretoArrayName + "_rg";
				getParetoData(waterShed,nutrient,fileName_temp,paretoArrayName_temp);
				break;
			case 6:
				fileName = fileName + "_DWM.txt";
				paretoArrayName = paretoArrayName + "_dwm";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
			case 7:
				fileName = fileName + "_SB.txt";
				paretoArrayName = paretoArrayName + "_sb";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
			case 8:
				fileName = fileName + "_NM.txt";
				paretoArrayName = paretoArrayName + "_nm";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
			case 9:
				fileName = fileName + "_AA.txt";
				paretoArrayName = paretoArrayName + "_aa";
				getParetoData(waterShed,nutrient,fileName,paretoArrayName);
				break;
		}		
	}
	
	function assignToParetoArray(arrayName,paretoValue,arrayIndex){
		switch(arrayName){
			case "bd_pareto_nit_fs":
				bd_pareto_nit_fs[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_gw":
				bd_pareto_nit_gw[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_cw":
				bd_pareto_nit_cw[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_cr":
				bd_pareto_nit_cr[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_rg":
				bd_pareto_nit_rg[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_br":
				bd_pareto_nit_br[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_cc":
				bd_pareto_nit_cc[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_dwm":
				bd_pareto_nit_dwm[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_sb":
				bd_pareto_nit_sb[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_nm":
				bd_pareto_nit_nm[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_nit_aa":
				bd_pareto_nit_aa[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_fs":
				bd_pareto_pho_fs[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_gw":
				bd_pareto_pho_gw[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_cw":
				bd_pareto_pho_cw[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_cr":
				bd_pareto_pho_cr[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_rg":
				bd_pareto_pho_rg[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_br":
				bd_pareto_pho_br[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_cc":
				bd_pareto_pho_cc[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_dwm":
				bd_pareto_pho_dwm[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_sb":
				bd_pareto_pho_sb[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_nm":
				bd_pareto_pho_nm[arrayIndex] = paretoValue;
				break;
			case "bd_pareto_pho_aa":
				bd_pareto_pho_aa[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_fs":
				blc_pareto_nit_fs[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_gw":
				blc_pareto_nit_gw[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_cw":
				blc_pareto_nit_cw[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_cr":
				blc_pareto_nit_cr[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_rg":
				blc_pareto_nit_rg[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_br":
				blc_pareto_nit_br[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_cc":
				blc_pareto_nit_cc[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_dwm":
				blc_pareto_nit_dwm[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_sb":
				blc_pareto_nit_sb[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_nm":
				blc_pareto_nit_nm[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_aa":
				blc_pareto_nit_aa[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_fs":
				blc_pareto_pho_fs[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_gw":
				blc_pareto_pho_gw[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_cw":
				blc_pareto_pho_cw[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_cr":
				blc_pareto_nit_cr[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_nit_rg":
				blc_pareto_nit_rg[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_br":
				blc_pareto_pho_br[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_cc":
				blc_pareto_pho_cc[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_dwm":
				blc_pareto_pho_dwm[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_sb":
				blc_pareto_pho_sb[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_nm":
				blc_pareto_pho_nm[arrayIndex] = paretoValue;
				break;
			case "blc_pareto_pho_aa":
				blc_pareto_pho_aa[arrayIndex] = paretoValue;
				break;
		}
	}
	
	function getParetoData(waterShed,nutrient,fileName, arrayName){
		$.post("http://swshydromodel:4567/getParetoData/"+ waterShed + "/" + nutrient + "/" + fileName,
			{
			},
			function(data,status){//callback function for handling response for POST request				
				var j;
				var temp = data.split("\n");
				for(j=0; j < temp.length; j++){
					assignToParetoArray(arrayName,temp[j],j);
				}
			}
		);
	}