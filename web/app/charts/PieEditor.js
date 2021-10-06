if(!bluewave) var bluewave={};

//******************************************************************************
//**  PieEditor
//******************************************************************************
/**
 *   Panel used to edit pie chart
 *
 ******************************************************************************/
/**
 *   Data Flow:
 *   init - stubs out chart areas
 *   initializeChartSpace - stubs out chart spaces
 *   Update - chart information and config is passed in.
 *   createDropDown - initializes chart Type specific dropdowns
 *   createOptions - adds chart input options from updated Data
 *      pie chart creation.
 ******************************************************************************/

bluewave.charts.PieEditor = function(parent, config) {
    var me = this;
    var panel;
    var inputData = [];
    var linksAndQuantity = [];
    var svg;
    var previewArea;
    var pieChart;
    var optionsDiv;
    var pieInputs={
        key:"",
        value:"",
        direction:""
    };
    var chartConfig = {
        pieKey:null,
        pieValue:null,
        pieDirection:null,
        chartTitle:null
    };
    var margin = {
        top: 15,
        right: 5,
        bottom: 65,
        left: 82
    };
    var styleEditor;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


        let table = createTable();
        let tbody = table.firstChild;
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        parent.appendChild(table);
        me.el = table;
        var td;

        td = document.createElement("td");
        tr.appendChild(td);
        let div = document.createElement("div");
        div.className = "chart-editor-options";
        td.appendChild(div);
        optionsDiv = div;


      //Create chart preview
        td = document.createElement("td");
        td.className = "chart-editor-preview";
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);
        panel = createDashboardItem(td,{
            width: "100%",
            height: "100%",
            title: "Untitled",
            settings: true
        });
        previewArea = panel.innerDiv;
        panel.el.className = "";


      //Allow users to change the title associated with the chart
        addTextEditor(panel.title, function(title){
            panel.title.innerHTML = title;
            chartConfig.chartTitle = title;
        });


      //Watch for settings
        panel.settings.onclick = function(){
            if (chartConfig) editStyle();
        };


      //Initialize chart area when ready
        onRender(previewArea, function(){
            initializeChartSpace();
        });
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(pieConfig, inputs){
        me.clear();

        for (var i=0; i<inputs.length; i++){
            var input = inputs[i];
            if (typeof input !== 'object' && input!=null) {
                inputs[i] = d3.csvParse(input);
            }
        }
        inputData = inputs;

        if (pieConfig) chartConfig = pieConfig;

        if (chartConfig.chartTitle){
            panel.title.innerHTML = chartConfig.chartTitle;
        }

        createDropDown(optionsDiv);
        createOptions();
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        inputData = [];
        chartConfig = {};
        panel.title.innerHTML = "Untitled";
        optionsDiv.innerHTML = "";

        if (pieChart) pieChart.clear();
    };


  //**************************************************************************
  //** getConfig
  //**************************************************************************
  /** Return chart configuration file
   */
    this.getConfig = function(){
        //let copy = Object.assign({},chartConfig);
        //return copy;
        return chartConfig;
    };


  //**************************************************************************
  //** getChart
  //**************************************************************************
    this.getChart = function(){
        return previewArea;
    };


  //**************************************************************************
  //** createOptions
  //**************************************************************************
  /** Initializes Options for Dropdowns.
   */
    var createOptions = function() {
        var data = inputData[0];
        var data2 = inputData[1];


        var nodeAndType = [];
        var nodeTypeList = [];

        if (data.hasOwnProperty("links")) {
            data = Object.values(inputData[0].links);

            for (var node in inputData[0].nodes) {
                var nodeType =inputData[0].nodes[node].type;
                var nodeName = inputData[0].nodes[node].name;
                if (nodeTypeList.indexOf(nodeType) === -1) {
                nodeTypeList.push(nodeType);
                }
                var nodeAndTypeEntry = {};
                nodeAndTypeEntry.id = node;
                nodeAndTypeEntry.type = nodeType;
                nodeAndTypeEntry.name = nodeName;
                nodeAndType.push(nodeAndTypeEntry);
            }

            for (var link in inputData[0].links) {
                var linkStartType = "";
                var linkEndType = "";
                var linkStartName = "";
                var linkEndName = "";
                var linkQuantity = inputData[0].links[link].quantity;

                for (var entry of nodeAndType) {
                    if (link.startsWith(entry.id)) {
                        linkStartType = entry.type;
                        linkStartName = entry.name;
                    }
                    if (link.endsWith(entry.id)) {
                        linkEndType = entry.type;
                        linkEndName = entry.name;
                    }

                }

                var linkFullType = linkStartType + " to " + linkEndName;
                var linksAndQuantityEntry = {};
                linksAndQuantityEntry.key = linkFullType;
                linksAndQuantityEntry.value = linkQuantity;
                linksAndQuantityEntry.sendType = linkStartType;
                linksAndQuantityEntry.receiveType = linkEndType;

                var previousEntryIndex = linksAndQuantity.findIndex(entry => entry.key === linkFullType);

                if (previousEntryIndex !== -1) {
                    linksAndQuantity[previousEntryIndex].value = linksAndQuantity[previousEntryIndex].value + linkQuantity;
                } else {
                    linksAndQuantity.push(linksAndQuantityEntry);
                }
            }
        }

        let dataOptions = Object.keys(data[0]);


        if(inputData[0].hasOwnProperty("links")) {
            dataOptions = nodeTypeList;
        }

        if(typeof pieInputs.value == "object") {
            pieInputs.value.clear();
        }

        pieInputs.key.clear();



        if (!inputData[0].hasOwnProperty("links")) {
            dataOptions.forEach((val)=>{
                if(!isNaN(data[0][val])){
                    pieInputs.value.add(val,val);
                } else{
                   pieInputs.key.add(val,val);
                }
            });
        } else {
            dataOptions.forEach((val)=>{
                pieInputs.key.add(val, val);
            });
//            pieInputs.value.add("quantity");
            chartConfig.pieValue = "quantity";
            pieInputs.direction.add("Inbound");
            pieInputs.direction.add("Outbound");
        }

        pieInputs.key.setValue(chartConfig.pieKey,chartConfig.pieKey);
        if(typeof pieInputs.value == "object") {
            pieInputs.value.setValue(chartConfig.pieValue,chartConfig.pieValue);
        }
        pieInputs.direction.setValue(chartConfig.pieDirection,chartConfig.pieDirection);
    };


  //**************************************************************************
  //** createDropDown
  //**************************************************************************
    var createDropDown = function(parent){

        var table = createTable();
        var tbody = table.firstChild;
        table.style.height = "";
        parent.appendChild(table);

        createPieDropdown(tbody);
    };


  //**************************************************************************
  //** createPieDropdown
  //**************************************************************************
    var createPieDropdown = function(tbody){
        dropdownItem(tbody,"pieKey","Group By",createPiePreview,pieInputs,"key");
        if (!inputData[0].hasOwnProperty("links")) {
            dropdownItem(tbody,"pieValue","Value Type",createPiePreview,pieInputs,"value");
        }
        dropdownItem(tbody,"pieDirection","Direction",createPiePreview,pieInputs,"direction");

    };


  //**************************************************************************
  //** dropdownItem
  //**************************************************************************
    var dropdownItem = function(tbody,chartConfigRef,displayName,callBack,input,inputType){
        var tr, td;

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        td.innerHTML= displayName+":";

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);


        input[inputType] = new javaxt.dhtml.ComboBox(td, {
            style: config.style.combobox,
            readOnly: true
        });
        input[inputType].clear();
        input[inputType].onChange = function(name,value){
            chartConfig[chartConfigRef] = value;
            callBack();
        };
    };


  //**************************************************************************
  //** initializeChartSpace
  //**************************************************************************
    var initializeChartSpace = function(){
        var width = previewArea.offsetWidth;
        var height = previewArea.offsetHeight;

        svg = d3.select(previewArea).append("svg");
        svg.attr("width", width);
        svg.attr("height", height);


        pieChart = new bluewave.charts.PieChart(svg, {
            margin: margin
        });

    };


  //**************************************************************************
  //** createPiePreview
  //**************************************************************************
    var createPiePreview = function(){
        if (chartConfig.pieKey===null || chartConfig.pieValue===null) return;
        onRender(previewArea, function(){
            var data = inputData[0];
            if (data.hasOwnProperty("links")) {
            data = linksAndQuantity.slice();
            data = data.filter(entry => entry.key.includes(chartConfig.pieKey));

            if(chartConfig.pieDirection === "Inbound") {
                data = data.filter(entry => entry.receiveType.endsWith(chartConfig.pieKey));
            } else {
                data = data.filter(entry => entry.sendType.startsWith(chartConfig.pieKey));
            }
            let scData = [];
            data.forEach(function(entry, index) {
                let scEntry = {};
                if (entry.key.includes(chartConfig.pieKey)) {
                    scEntry[chartConfig.pieKey] = entry.key;
                    scEntry[chartConfig.pieValue] = entry.value;
                }
                scData.push(scEntry);
            });
            data = scData;
            }
            pieChart.update(chartConfig, data);
        });
    };


  //**************************************************************************
  //** editStyle
  //**************************************************************************
    var editStyle = function(){

      //Create styleEditor as needed
        if (!styleEditor){
            styleEditor = new javaxt.dhtml.Window(document.body, {
                title: "Edit Style",
                width: 400,
                valign: "top",
                modal: false,
                resizable: false,
                style: config.style.window
            });
        }


      //Update form
        var body = styleEditor.getBody();
        body.innerHTML = "";

        var form = new javaxt.dhtml.Form(body, {
            style: config.style.form,
            items: [
                {
                    group: "Style",
                    items: [
                        {
                            name: "color",
                            label: "Color",
                            type: new javaxt.dhtml.ComboBox(
                                document.createElement("div"),
                                {
                                    style: config.style.combobox
                                }
                            )
                        },
                        {
                            name: "cutout",
                            label: "Cutout",
                            type: "text"
                        },
                        {
                            name: "labels",
                            label: "Labels",
                            type: "radio",
                            alignment: "vertical",
                            options: [
                                {
                                    label: "True",
                                    value: true
                                },
                                {
                                    label: "False",
                                    value: false
                                }
                            ]
                        }
                    ]
                }
            ]
        });


          //Update cutout field (add slider) and set initial value
            createSlider("cutout", form, "%");
            var cutout = chartConfig.pieCutout;
            if (cutout==null) cutout = 0.65;
            chartConfig.pieCutout = cutout;
            form.findField("cutout").setValue(cutout*100);


          //Tweak height of the label field and set initial value
            var labelField = form.findField("labels");
            labelField.row.style.height = "68px";
            var labels = chartConfig.pieLabels;
            labelField.setValue(labels===true ? true : false);


          //Process onChange events
            form.onChange = function(){
                var settings = form.getData();
                chartConfig.pieCutout = settings.cutout/100;
                if (settings.labels==="true") settings.labels = true;
                else if (settings.labels==="false") settings.labels = false;
                chartConfig.pieLabels = settings.labels;
                createPiePreview();
            };




        styleEditor.showAt(108,57);
        form.resize();
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var onRender = javaxt.dhtml.utils.onRender;
    var createTable = javaxt.dhtml.utils.createTable;
    var getData = bluewave.utils.getData;
    var createDashboardItem = bluewave.utils.createDashboardItem;
    var createSlider = bluewave.utils.createSlider;
    var addTextEditor = bluewave.utils.addTextEditor;

    init();
};