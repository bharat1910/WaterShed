package edu.illinois.isws.server;

import static spark.Spark.*;
import spark.*;
import org.apache.commons.io.FileUtils;
import java.io.File;
import java.io.IOException;
import java.util.Date;

/*
 * Server that handles following
 * (i) run single simulation request
 * (ii) send pareto data to client
 * (iii) send HRU x BMP constraints to client
 * (iv) send HRU x Landuse x Soils report
 */
public class Server {
	static String WORKING_DIRECTORY =  null;
	public static void main(String[] args) {
		final String NEW_LINE = System.getProperty("line.separator");
		final String PARETO_DIR = "paretoData/";
		final String CONSTRAINTS_DIR = "constraints/";
		final String REPORT_DIR = "HRULandUseSoilsReport/";
		final String SUBBASIN_REDUCTION = "subbasin_reduction.txt";
		final String DSS_HOME_PAGE = "html/ws_bmp_allBMP.html";
		final String JS_DIR = "js/";		
		
		/* 
		 * Home page for the Decision Support System
		 */
		get(new Route("/dss") {
			@Override
			public Object handle(Request request, Response response) {
				String result = null;
				// set the response type
				response.type("text/html");
				try {
					result = FileUtils
							.readFileToString(new File(DSS_HOME_PAGE));
				} catch (IOException e) {
					e.printStackTrace();
				}
				return result;
			}
		});
		
		/* 
		 * Download HRU Soils LandUse report
		 */
		get(new Route("/downloadReport") {
			@Override
			public Object handle(Request request, Response response) {
				String result = null;
				String filename = null;
				// set the response type
				response.type("text");
				
				String wsIndex = request.queryParams("wshIndex");
				String fileType = request.queryParams("fileType");
				
				if(wsIndex.equals("bd")){
					filename = getFileName("bigDitch_HRULandUseSoilsReport",fileType);
					response.header("content-disposition", "attachment;filename="+filename);
					
				}else if(wsIndex.equals("blc")){
					filename = getFileName("bigLongCreek_HRULandUseSoilsReport",fileType);
					response.header("content-disposition", "attachment;filename="+filename);
				}
				
				try {
					result =  FileUtils.readFileToString(new File(
							REPORT_DIR + filename));
				} catch (IOException e) {
					e.printStackTrace();
				}
				return result;
			}
			
			private String getFileName(String name, String type){
				String output = "";
				if (type.equals("txt")){
					output =  name + ".txt";
				}
				else if (type.equals("csv")){
					output =  name + ".csv";
				}
				return output;
			}
		});
		
		/* 
		 * Load the Javascript files
		 */		
		get(new Route("/:js_file") {
			@Override
			public Object handle(Request request, Response response) {
				String result = null;
				String js_file_name = request.params(":js_file");
				// set the response type
				if (js_file_name.equals("dss_pareto.js")
						|| js_file_name.equals("dss_bmp_eval.js")
						|| js_file_name.equals("dss_hru_bmp_constraint.js")
						|| js_file_name.equals("chosen.jquery.min.js")
						|| js_file_name.equals("chosen.proto.min.js")) {
					response.type("script");
					try {
						result = FileUtils
								//.readFileToString(new File("ws_bmp_Presentation.html"));
								.readFileToString(new File(JS_DIR + js_file_name));
					} catch (IOException e) {
						e.printStackTrace();
					}
				}
				return result;
			}
		});
		
		/*
		 * Handle GET request from client.
		 * Client posts a GET request to run single simulation
		 */
		post(new Route("/singlerun") {
			@Override
			public Object handle(Request request, Response response) {
				
				if(! parseClientInputs(request)) {
					System.out.println("Error while parsing client inputs.");
					return "failed";
				}
				
				int result = runOCMExecutable();
				
				if (result == -1){
					return "in_use";
				}else if (result == -2){
					return "failed";
				}
				
				return getOutputString();
			}

			
			/*
			 * Parse client inputs.
			 * Save the client inputs in the input file for OCM single simulation
			 * "Client_Input.txt" - flag to denote single simulation,flag to denote water shed,
			 * 						BMP for HRUs ( the list is in ascending order of HRUs )
			 * "BMP_DB_09_single_simulation.txt" - cost for all BMPs
			 */
			private boolean parseClientInputs(Request request) {
				String bmps = request.queryParams("listHruBMP");
				String cost = request.queryParams("cost");

				bmps = bmps.replace(",", NEW_LINE);
				cost = cost.replace(";", NEW_LINE);
				
				if (request.queryParams("wshIndex").equals("1")){
					WORKING_DIRECTORY = "ocm/BigDitchWs/"; 
				}
				else if (request.queryParams("wshIndex").equals("2")){
					WORKING_DIRECTORY = "ocm/BigLongCreekWs/";
				}
				else {
					System.out.println("Parsing client input:unknown watershed.");
					return false;
				}

				try {
					FileUtils.writeStringToFile(
							new File(WORKING_DIRECTORY +"Client_Input.txt"),
							request.queryParams("is_single_simulation")
									+ NEW_LINE
									+ request.queryParams("wshIndex")
									+ NEW_LINE + bmps);
					FileUtils.writeStringToFile(new File(
							WORKING_DIRECTORY + "clientInput_BMPCost.txt"), cost);
				} catch (IOException e) {
					System.out.println("Parsing client input:exception while preparing input files for OCM.");
					e.printStackTrace();
					return false;
				}
				return true;
			}

			/*
			 * Helper method to run the OCM fortran executable.
			 */
			private int runOCMExecutable() {
				Process process = null;
				try {
					ProcessBuilder builder = new ProcessBuilder(WORKING_DIRECTORY +"OCM_AMGA2_IndBMP_LHS.exe");
					builder.directory(new File(WORKING_DIRECTORY));
					builder.redirectErrorStream(true);
					File output = new File(WORKING_DIRECTORY+"spark_ocm_output.txt");
					builder.redirectOutput(output);
					
					process = builder.start();
				} catch (Exception e) {
					System.out.println("Error: " + WORKING_DIRECTORY +  e.getMessage());
					e.printStackTrace();
					return -1;
				}

				try {
					System.out.println("Execution Started : " + (new Date()).toString());
					String result = null;
					process.waitFor();
					System.out.println("Execution completed : " + (new Date()).toString());
					result = FileUtils.readFileToString(new File(WORKING_DIRECTORY + "spark_ocm_output.txt"));
					if (result == null || !result.contains("Execution successfully completed")){
						System.out.println("***Execution Failed***");
						return -2;
					}
					else{
						System.out.println("***Execution Successful***");
					}
				} catch (Exception e) {
					// Handle exception that could occur when waiting
					// for a spawned process to terminate
					System.out.println("***Exception Occurred***");
					e.printStackTrace();
					return -2;
				}
				return 0;
			}
			
			/*
			 * Helper method to get output file as a string.
			 * "scenario_simulation.txt" is the output file from OCM single simulation.
			 * Just send this output to client as a string.
			 */
			private Object getOutputString() {
				String output;
				//collect single simulation reduction at watershed level
				try {
					String withBMP = FileUtils.readFileToString(new File(
							WORKING_DIRECTORY + "clientRequestOutput.txt"));
					String noBMP = FileUtils.readFileToString(new File(
							WORKING_DIRECTORY + "NoBMPLoads.txt"));
					
					
					String[] withBMPValues;
					String[] noBMPValues;
					
					while(withBMP.indexOf("/") != -1){
						withBMP = withBMP.substring(withBMP.indexOf("/") + 1);
					}
					
					while(noBMP.indexOf("/") != -1){
						noBMP = noBMP.substring(noBMP.indexOf("/") + 1);
					}
					
					String[] temp = withBMP.split(" ");
					withBMP = "";
					for(String load : temp){
						if(! load.equals("")){
							try{
								Double.parseDouble(load);
								withBMP = withBMP + "," + load.trim();
							}catch(Exception e){
								//Intentional pass through
							}
						}
					}			
					withBMPValues = (withBMP.substring(1)).split(",");
					
					temp = noBMP.split(" ");
					noBMP = "";
					for(String load : temp){
						if(! load.equals("")){
							try{
								Double.parseDouble(load);
								noBMP = noBMP + "," + load.trim();
							}catch(Exception e){
								//Intentional pass through
							}
						}
					}
					noBMPValues = (noBMP.substring(1)).split(",");
					
					
					output = "";
					for(int index = 0; index < 4 ; index++){
						output = output + withBMPValues[index] + " ";
						output = output + noBMPValues[index] + " ";
					}
					output = output + withBMPValues[4];			
							
					System.out.println(output.toString());
				} catch (IOException e) {
					e.printStackTrace();
					return "Error...";
				}
				//collect single simulation reduction at watershed level ENDS
				
				output = output.concat("\n");
				//collect single simulation reduction at subbasin level
				try{
					 output = output.concat(FileUtils.readFileToString(new File(
							WORKING_DIRECTORY + SUBBASIN_REDUCTION)));
				}catch (Exception e){
					e.printStackTrace();
					return output;
				}
				//collect single simulation reduction at subbasin level ENDS
				
				return output;
			}
		});
		
		/*
		 * Handle POST request from client.
		 * Client posts a request to fetch pareto data
		 */
		post(new Route("/getParetoData/:waterShed/:nutrientType/:fileName") {
			@Override
			public Object handle(Request request, Response response) {
				String pareto_file_name = request.params(":waterShed") + "/" + request.params(":nutrientType") + "/" +request.params(":fileName");
				try{
					return FileUtils.readFileToString(new File(
							PARETO_DIR + pareto_file_name));
				}catch (Exception e){
					e.printStackTrace();
					return "";
				}
			}				
		});		
		
		/*
		 * Handle POST request from client.
		 * Client posts a request to fetch hru/bmp constraints
		 */
		post(new Route("/getConstraints/:waterShed/:fileName") {
			@Override
			public Object handle(Request request, Response response) {
				String pareto_file_name = request.params(":waterShed") + "/" + request.params(":fileName");
				try{
					return FileUtils.readFileToString(new File(
							CONSTRAINTS_DIR + pareto_file_name));
				}catch (Exception e){
					e.printStackTrace();
					return "";
				}
			}				
		});
	}
}