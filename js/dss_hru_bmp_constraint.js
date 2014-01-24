	/*
	 * Arrays for constraints
	 */
	var bd_hru_const_sb = new Array();
	var bd_hru_const_br = new Array();
	var bd_hru_const_dm = new Array();
	var bd_hru_const_gw = new Array();
	var bd_hru_const_cw = new Array();
	var bd_hru_const_cc = new Array();
	var bd_hru_const_nm = new Array();
	var bd_hru_const_pc = new Array();
	var bd_hru_const_fs = new Array();
	
	var blc_hru_const_sb = new Array();
	var blc_hru_const_br = new Array();
	var blc_hru_const_dm = new Array();
	var blc_hru_const_gw = new Array();
	var blc_hru_const_cw = new Array();
	var blc_hru_const_cc = new Array();
	var blc_hru_const_nm = new Array();
	var blc_hru_const_pc = new Array();
	var blc_hru_const_fs = new Array();
	
	/*
	 * Some of the BMPs cannot be applied to all the HRUs in the watershed
	 * SB / BR / DM have these constraints
	 * this functions loads the HRUs where above BMPs cannot be applied
	 */	
	function loadConstraints(){
		getConstraints("bigditch","HRUsWithNoBR.txt","br");		
		getConstraints("bigditch","HRUsWithNoDM.txt","dm");
		getConstraints("bigditch","HRUsWithNoSB.txt","sb");
		getConstraints("bigditch","HRUsWithNoGW.txt","gw");
		getConstraints("bigditch","HRUsWithNoCW.txt","cw");
		getConstraints("bigditch","HRUsWithNoCC.txt","cc");
		getConstraints("bigditch","HRUsWithNoNM.txt","nm");
		getConstraints("bigditch","HRUsWithNoPC.txt","pc");
		getConstraints("bigditch","HRUsWithNoFS.txt","fs");
		
		
		getConstraints("biglongcreek","HRUsWithNoBR.txt","br");
		getConstraints("biglongcreek","HRUsWithNoDM.txt","dm");
		getConstraints("biglongcreek","HRUsWithNoSB.txt","sb");
		getConstraints("biglongcreek","HRUsWithNoGW.txt","gw");
		getConstraints("biglongcreek","HRUsWithNoCW.txt","cw");
		getConstraints("biglongcreek","HRUsWithNoCC.txt","cc");
		getConstraints("biglongcreek","HRUsWithNoNM.txt","nm");
		getConstraints("biglongcreek","HRUsWithNoPC.txt","pc");
		getConstraints("biglongcreek","HRUsWithNoFS.txt","fs");
	}
	
	function assignToConstraintArray(ws,bmp,arr){
		if(ws == "bigditch"){
			switch(bmp){
			case "br":
				copyArray(bd_hru_const_br,arr);
				break;
			case "dm":
				copyArray(bd_hru_const_dm,arr);
				break;
			case "sb":
				copyArray(bd_hru_const_sb,arr);
				break;
			case "gw":
				copyArray(bd_hru_const_gw,arr);
				break;
			case "cw":
				copyArray(bd_hru_const_cw,arr);
				break;
			case "cc":
				copyArray(bd_hru_const_cc,arr);
				break;
			case "nm":
				copyArray(bd_hru_const_nm,arr);
				break;
			case "pc":
				copyArray(bd_hru_const_pc,arr);
				break;
			case "fs":
				copyArray(bd_hru_const_fs,arr);
				break;
			}			
		}
		else if (ws == "biglongcreek"){
			switch(bmp){
			case "br":
				copyArray(blc_hru_const_br,arr);
				break;
			case "dm":
				copyArray(blc_hru_const_dm,arr);
				break;
			case "sb":
				copyArray(blc_hru_const_sb,arr);
				break;
			case "gw":
				copyArray(blc_hru_const_gw,arr);
				break;
			case "cw":
				copyArray(blc_hru_const_cw,arr);
				break;
			case "cc":
				copyArray(blc_hru_const_cc,arr);
				break;
			case "nm":
				copyArray(blc_hru_const_nm,arr);
				break;
			case "pc":
				copyArray(blc_hru_const_pc,arr);
				break;
			case "fs":
				copyArray(blc_hru_const_fs,arr);
				break;
			}	
		}		
	}
	
	function copyArray(dest,source){
		var j = 0;
		for(var i=0; i < source.length; i++){
			dest[j++] = source[i];
		}
	}
	
	function getConstraints(waterShed,fileName,bmp){
		$.post("/getConstraints/"+ waterShed + "/" + fileName,
			{
			},
			function(data,status){//callback function for handling response for POST request
				
				//alert(data);
				var j;
				var temp = data.split("\n");
				assignToConstraintArray(waterShed,bmp,temp);
			}
		);
	}