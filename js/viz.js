//------------------------------- VIZ 1 SIMON -----------------------------------------
function BakeryViz1(dataset) {
    const margin = ({ top: 35, right: 70, bottom: 35, left: 70 })
    const w = 1150
    const h = 400

    var svg = d3.select("#number_clients").append("svg").attr("height", h).attr("width", w)

    // Title
    svg.append('text')
        .attr('x', w / 2 - 30)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 20)
        .text('Nombre de client en fonction du temps');

    // X label
    svg.append('text')
        .attr('x', w / 2 - 30)
        .attr('y', h - margin.bottom + 30)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text('Temporalité');

    // Y label
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(20,' + h / 2 + ')rotate(-90)')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text("Nombre");

    // X axis range init
    var x = d3.scaleTime().range([margin.left, w - margin.left - margin.right])
    var xAxis = svg.append("g").attr("transform", `translate(0,${h - margin.bottom})`)

    // Y axis range init
    var y = d3.scaleLinear().range([h - margin.bottom, 0 + margin.top])
    var yAxis = svg.append("g").attr("transform", `translate(${margin.left},0)`)



    function update(nbBins, startDate, endDate) {

        var essai = d3.scaleTime().domain([startDate, endDate])

        const binX = d3.bin().domain(essai.domain()).thresholds(essai.ticks(nbBins))
        const bucketsX = binX(dataset.filter(s => s.date >= startDate && s.date <= endDate).map(d => d.date))


        x.domain([d3.min(bucketsX.map(d => d.x0)), d3.max(bucketsX.map(d => d.x1))])
        xAxis.transition()
            .duration(1000)
            .call(d3.axisBottom(x))

        var my_map = d3.groups(dataset, d => d.ticket_number)
        var bin_for_tickets = d3.bin().domain(x.domain()).thresholds(x.ticks(nbBins));
        var buckets_nb_tickets = bin_for_tickets(my_map.map(d => d[1].map(j => j)).map(k => k[0].date))


        // Y axis Update
        y.domain([0, d3.max(buckets_nb_tickets.map(d => d.length))])
        yAxis.transition()
            .duration(1000)
            .call(d3.axisLeft(y));



        // Join the rect with the bins data
        var current_rects = svg.selectAll("rect")
            .data(buckets_nb_tickets)

        current_rects.enter()
            .append("rect")
            .merge(current_rects)
            .transition()
            .duration(1000)
            .attr("transform", d => "translate(" + x(d.x0) + "," + y(d.length) + ")")
            .attr("width", d => x(d.x1) - x(d.x0))
            .attr("height", d => h - y(d.length) - margin.bottom)
            .style("fill", "red")
            .style("opacity", 0.6)

        // Removing rects not in use
        current_rects.exit()
            .remove()
    }


    //FIRST INIT
    let initStartDate = d3.min(dataset.map(d => d.date))
    let initEndDate = d3.max(dataset.map(d => d.date))
    update(10, initStartDate, initEndDate)

    //DYNAMIC (better with JQuery slider)
    const minDate = d3.min(dataset.map(d => d.date))
    const maxDate = d3.max(dataset.map(d => d.date))
    $("#slider-range").slider({
        range: true,
        min: new Date(minDate).getTime() / 1000,
        max: new Date(maxDate).getTime() / 1000,
        step: 86400,
        values: [new Date(minDate).getTime() / 1000, new Date(maxDate).getTime() / 1000],
        slide: function (event, ui) {
            $("#amount").val((new Date(ui.values[0] * 1000).toDateString()) + " - " + (new Date(ui.values[1] * 1000)).toDateString());
        },
        change: function (event, ui) {
            let arr = document.getElementById("amount").value.split(" - ")
            let parseTime = d3.timeParse("%a %b %d %Y");
            let startDate = parseTime(arr[0])
            let endDate = parseTime(arr[1])
            update(30, startDate, endDate)
        }
    })

    $("#amount").val((new Date($("#slider-range").slider("values", 0) * 1000).toDateString()) +
        " - " + (new Date($("#slider-range").slider("values", 1) * 1000)).toDateString())

}

//-----------------VIZ 2 LINA ---------------------
function getFrequentItemCorr(dataset, hour_value) {
    const sortedData = dataset.slice().sort((a, b) => d3.descending(a.article, b.article))
    const datasetByHours = d3.group(sortedData, d => d.hours)

    const datasetByHour = datasetByHours.get(hour_value)
    let articles = [];
    let item_count = [];

    // Get list of item
    d3.groups(datasetByHour, d => d.article).map(
        article => !articles.includes(article[0]) ? (articles.push(article[0])) : console.log()
    )

    // Init
    for (let i = 0; i < articles.length; i++) {
        item_count[i] = new Array(articles.length).fill(0);
    }

    //get frequent item
    const article_by_client = d3.groups(datasetByHour, d => d.ticket_number)
    for (let i = 0; i < article_by_client.length; i++) {
        let tmp = []
        for (let j = 0; j < article_by_client[i][1].length; j++) {
            tmp.push(article_by_client[i][1][j].article)
        }

        for (let item_a = 0; item_a < tmp.length; item_a++) {
            for (let item_b = 0; item_b < tmp.length; item_b++) {
                item_count[articles.indexOf(tmp[item_a])][articles.indexOf(tmp[item_b])] += 1
            }
        }
    }

    // transform in percentage
    for (let i = 0; i < articles.length; i++) {
        let divisor = item_count[i][i]
        for (let j = 0; j < articles.length; j++) {
            item_count[i][j] = item_count[i][j] / divisor
        }
    }

    return [articles, item_count]
}

function BakeryViz2(dataset) {

    // Static Part
    const margin = ({ top: 10, right: 250, bottom: 30, left: 40 })
    const w = 3000
    const h = 400
    const svg = d3.select("#corr_viz").append("svg").attr("height", h).attr("width", w)
    var myColor = d3.scaleLinear().domain([0.01, 1]).range(["#f4cccc", "#cc0000"])

    const select = document.getElementById("aricleName");
    var contenu = `<option selected>Tous les articles</option>`;
    const article = d3.group(dataset, d => d.article);
    for (let key of article.keys()) {
        contenu += `<option value="${key}">${key}</option>`
    }
    select.innerHTML = contenu;

    //Dynamic Part
    function update() {

        // Cleaning of the SVG
        svg.selectAll("rect").remove()
        svg.selectAll("g").remove()


        // create a tooltip
        var Tooltip = d3.select("#corr_viz")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        //Computation with the value of the slider
        hour_value = Number(document.getElementById("sliderCorr").value)
        data = getFrequentItemCorr(dataset, hour_value)
        x = data[0]
        y = data[1]

        for (let i = 0; i < y.length; i++) {
            for (let j = 0; j < y[i].length; j++) {
                svg.append("rect")
                    .attr('x', 100 + i * 90)
                    .attr('y', 67 + 30 * j)
                    .attr('width', 90)
                    .attr('height', 30)
                    .attr('fill', function () { return myColor(y[i][j]) })
                    .on('mouseover', function (d, i) {
                        Tooltip.style("opacity", 1)
                        d3.select(this).transition()
                            .duration('50')
                            .attr('opacity', '.80')

                    })
                    .on("mousemove", function (d, f) {
                        Tooltip
                            .html("Lorsque " + x[i] + " est acheté, on achète avec " + x[j] + " " + y[i][j] * 100 + "% du temps à " + hour_value + " heure")
                            .style("left", (d3.mouse(this)[0]) + "px")
                            .style("top", (d3.mouse(this)[1]) + 100 + "px")
                    })
                    .on('mouseout', function (d, i) {
                        Tooltip
                            .style("opacity", 0)
                        d3
                            .select(this).transition()
                            .duration('50')
                            .attr('opacity', '1')
                    })
            }
        }


        // Axe X
        svg.append("g").selectAll("text").data(x).enter()
            .append("text")
            .attr("x", (d, i) => 100 + i * 90)
            .attr("y", d => 40)
            .text(d => d)
            .attr("font-size", "7.5px")

        // Axe Y
        svg.append("g").selectAll("text").data(x).enter()
            .append("text")
            .attr("x", d => 10)
            .attr("y", (d, i) => 75 + i * 30)
            .text(d => d)
            .attr("font-size", "8px")

        // Legend 
        svg.append("g").selectAll("text").data(d3.range(0, 1, 0.1)).enter()
            .append("rect")
            .attr('x', (d, i) => 100 + 90 * i)
            .attr('y', 380)
            .attr('width', 90)
            .attr('height', 10)
            .attr('fill', function (d) { return myColor(d) })

        // Legend info
        svg.append("g").selectAll("text").data(d3.range(0, 110, 10)).enter()
            .append("text")
            .attr('x', (d, i) => 100 + 90 * i)
            .attr('y', 400)
            .text(d => d)
            .attr("font-size", "10px")

        // Title
        svg.append("text")
            .attr("x", 5)
            .attr("y", margin.top + 5)
    }


    // first init
    update()

    // DYNAMIC
    d3.select("#sliderCorr").on("click", function () {
        update()
    })

    d3.select("#aricleName").on("change", function () {
        const checked = document.getElementById("aricleName");
        if ("Tous les articles" == checked.value && !stateVis2) {
            console.log("pas de changement d'etat")
        } else {
            const body = document.getElementById("corr_viz");
            d3.csv(
                "https://simon-klop.github.io/Data-Viz/Bakery_cleaned2.csv",
                conversor2,
                function (data) {
                    if (!stateVis2) {
                        body.innerHTML = ``
                        console.log("zoom");
                        stateVis2 = true
                        BakeryViz2Bis(data, checked.value)
                    }
                }
            )
        }
    })
}

function BakeryViz2Bis(dataset, product) {
    const margin = ({ top: 10, right: 250, bottom: 30, left: 40 })

    const top = 10
    const w = 3000
    const h = 400

    const svg = d3.select("#corr_viz").append("svg").attr("height", h).attr("width", w)
    var myColor = d3.scaleLinear().domain([0.01, 1]).range(["#f4cccc", "#cc0000"])

    //Dynamic Part
    function update(product) {

        // Cleaning of the SVG
        svg.selectAll("rect").remove()
        svg.selectAll("g").remove()
        svg.selectAll("text").remove()

        //Computation with the value of the slider
        hour_value = Number(document.getElementById("sliderCorr").value)
        data = getFrequentItemCorr(dataset, hour_value)
        x = data[0]
        y = data[1]
        item = x.indexOf(product)

        for (let i = 0; i < top; i++)
        {
            svg.append("rect")
                .attr('x', 100)
                .attr('y', 67 + 30 * i)
                .attr('width', 900)
                .attr('height', 30)
                .attr('fill', function () { return myColor(y[item][i]) })
                .on('mouseover', function (d, i) {
                    d3.select(this).transition()
                        .duration('50')
                        .attr('opacity', '.80')
                
                })
                .on('mouseout', function (d, i) {
                    d3.select(this).transition()
                        .duration('50')
                        .attr('opacity', '1')
                })
          }

        // Axe Y
        svg.append("g").selectAll("text").data(x).enter()
            .append("text")
            .attr("x", d => 10)
            .attr("y", (d, i) => 75 + i * 30)
            .text(d => d)
            .attr("font-size", "8px")

        // Legend 
        svg.append("g").selectAll("text").data(d3.range(0, 1, 0.1)).enter()
            .append("rect")
            .attr('x', (d, i) => 100 + 90 * i)
            .attr('y', 380)
            .attr('width', 90)
            .attr('height', 10)
            .attr('fill', function (d) { return myColor(d) })

        // Legend info
        svg.append("g").selectAll("text").data(d3.range(0, 110, 10)).enter()
            .append("text")
            .attr('x', (d, i) => 100 + 90 * i)
            .attr('y', 400)
            .text(d => d)
            .attr("font-size", "10px")

        // Titre
        svg.append("text")
            .attr("x", 5)
            .attr("y", margin.top + 5)
            .text("Produits les plus vendus avec un/une " + product + " à " + hour_value + " heure")
    }

    // first init
    update(product)

    // DYNAMIC
    d3.select("#sliderCorr").on("click", function () {
        const checked = document.getElementById("aricleName");
        update(checked.value)
    })

    d3.select("#aricleName").on("change", function () {
        const checked = document.getElementById("aricleName");
        if ("Tous les articles" == checked.value && !stateVis2) {
            console.log("pas de changement d'etat")
        } else {
            const body = document.getElementById("corr_viz");
            d3.csv(
                "https://simon-klop.github.io/Data-Viz/Bakery_cleaned2.csv",
                conversor2,
                function (data) {
                    if ("Tous les articles" == checked.value && stateVis2) {
                        body.innerHTML = ``
                        console.log("dezoom");
                        stateVis2 = false
                        BakeryViz2(data)
                    } else if (!stateVis2) {
                        body.innerHTML = ``
                        console.log("zoom");
                        stateVis2 = true
                        BakeryViz2Bis(data, checked.value)
                    } else {
                        console.log("zoom_update");
                        stateVis2 = true
                        update(checked.value)
                    }
                }
            )
        }
    })

}

//-----------------VIZ 3 LINA ---------------------

function BakeryViz3(dataset) {

    const margin = ({ top: 10, right: 210, bottom: 30, left: 60 })

    const w = 1000
    const h = 400

    const svg = d3.select("#linechart").append("svg").attr("height", h).attr("width", w)

    const MapQuantityByHours = d3.rollup(dataset, v => d3.sum(v, d => d.Quantity), d => d.hours, d => d.article)
    const index_hours = d3.groups(dataset, d => d.hours)
    const index_article = d3.groups(dataset, d => d.article)
    const group_points = index_hours.map(h =>
        index_article.map(a =>
            JSON.parse(
                '{"Hours":' + h[0] + ', "Article":"' + a[0] + '", "Counts":' +
                ((MapQuantityByHours.get(h[0]).get(a[0]) != undefined) ?
                    MapQuantityByHours.get(h[0]).get(a[0]) : 0)
                + '}')
        )
    )

    // create a tooltip
    var Tooltip = d3.select("#linechart")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    var points = []
    for (let i = 0; i < group_points.length; i++) {
        points = points.concat(group_points[i])
    }
    points = points.slice().sort((a, b) => d3.ascending(a.Hours, b.Hours))


    const x = d3.scaleTime().domain(d3.extent(points, d => d.Hours)).range([margin.left, w - margin.left - margin.right])
    const y = d3.scaleLinear().domain(d3.extent(points, d => d.Counts)).range([h - margin.bottom, margin.top])
    const c = d3.scaleOrdinal().domain(
        new Set(points.map(d => d.Article))).range(["red", "green", "blue", "yellow", "pink", "purple", "orange", "black", "cyan", "brown"])

    // abscisse et ordonnée
    svg.append("g")
        .attr("transform", `translate(0,${h - margin.bottom})`)
        .call(d3.axisBottom(x))

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))

    // X label
    svg.append('text')
        .attr('x', (w - margin.right) / 2 - 25)
        .attr('y', h - margin.bottom + 30)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text('Heure');

    // Y label
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(8,' + h / 2 + ')rotate(-90)')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text("Nombre de produit acheté");

    // cercle de couleur : Point
    svg.selectAll("circle").data(points).enter()
        .append("circle")
        .attr("cx", d => x(d.Hours))
        .attr("cy", d => y(d.Counts))
        .attr("r", d => 3)
        .style("fill", d => c(d.Article))
        .on('mouseover', function (d, i) {
            Tooltip.style("opacity", 1)
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.80')

        })
        .on("mousemove", function (d, f) {
            Tooltip
                .html("Hours : " + d.Hours + " \n Counts : " + d.Counts + " \n Article : " + d.Article)
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", (d3.mouse(this)[1]) + 100 + "px")
        })
        .on('mouseout', function (d, i) {
            Tooltip
                .style("opacity", 0)
            d3
                .select(this).transition()
                .duration('50')
                .attr('opacity', '1')
        })

    // lines
    const group_point = d3.groups(points, d => d.Article)

    const line = d3.line()
        .x(d => x(d.Hours))
        .y(d => y(d.Counts))

    svg.selectAll(".line")
        .data(group_point)
        .enter()
        .append("path")
        .datum((d) => d[1])
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke", (d) => c(d[1].Article))
        .attr("d", d3.line()
            .x(d => x(+d.Hours))
            .y(d => y(+d.Counts))
        )

    // LEGENDE :

    // Titre
    svg.append("text")
        .attr("x", w - margin.right - 25)
        .attr("y", margin.top + 5)
        .text("Nombre de produits acheté/h")

    // rect couleur
    svg.selectAll("rect").data(c.domain()).enter()
        .append("rect")
        .attr("x", d => w - margin.right - 15)
        .attr("y", (d, i) => i * 20 + + margin.top + 20)
        .attr("width", d => 10)
        .attr("height", d => 10)
        .style("fill", d => c(d))

    // Nom d'article
    svg.append("g").selectAll("text").data(c.domain()).enter()
        .append("text")
        .attr("x", d => w - margin.right)
        .attr("y", (d, i) => i * 20 + 10 + margin.top + 20)
        .text(d => d)

}

function BakeryViz4(dataset) {
    const select = document.getElementById("vis4select");
    var contenu = ``;
    for (let i = 0; i < Object.keys(dataset.children).length; i++) {
        contenu = contenu + `
        
        <div class="input-group mb-3">
            <div class="input-group-text">
                    <label>${dataset.children[i].name} : </label> </br>
                    <input type="number" min="0" value=0 max="100">
            </div>
            
            
           
        </div>`;
    }
    select.innerHTML = contenu;
    const margin = ({ top: 35, right: 70, bottom: 35, left: 70 })
    const w = 400
    const h = 400

    var svg = d3.select("#pack").append("svg").attr("height", h).attr("width", w)
}

// ______________________________ LOAD DATA ______________________________


LoadBakeryAndDrawV1()
LoadBakeryAndDrawV2V3()
LoadBakeryAndDrawV4()
var stateVis2 = false;

function conversor1(d) {
    const parseTime = d3.timeParse("%Y-%m-%d");
    d.date = parseTime(d.date)
    d.unit_price = +d.unit_price
    d.ticket_number = +d.ticket_number
    d.quantity = +d.quantity
    return d;
}


function conversor2(d) {
    d.ticket_number += d.ticket_number
    d.Quantity = +d.Quantity
    d.datetime = d3.timeParse("%Y-%M-%d:%H:%M")(d.date + ":" + d.time)
    d.weekday = d.datetime.getDay()
    d.hours = d.datetime.getHours()
    d.month = d.datetime.getMonth()
    return d
}


async function LoadBakeryAndDrawV1() {
    d3.csv(
        "https://simon-klop.github.io/Data-Viz/Bakery_cleaned2.csv",
        conversor1,
        function (data) {
            BakeryViz1(data)
        })
}


async function LoadBakeryAndDrawV2V3() {
    d3.csv(
        "https://simon-klop.github.io/Data-Viz/Bakery_cleaned2.csv",
        conversor2,
        function (data) {
            BakeryViz2(data),
                BakeryViz3(data)
        })
}


async function LoadBakeryAndDrawV4() {
    d3.json(
        "https://simon-klop.github.io/Data-Viz/receipts.json",
        function (data) {
            BakeryViz4(data)
        })
}


function init() {
    var body = document.getElementById("vis4");

    body.innerHTML = `<div class="col-sm-3"id="bodyvis4">
        <div class="card">
            <div class="card-header">
                Quel/combien d'article souhaitez-vous observer? 
            </div>
            <div class="card-body" id="vis4select"></div>
        </div>
    </div>

    <div class="col-sm-6">
        <div class="card">
            <div class="card-body">
                <div id="pack"></div>
            </div>
        </div>
    </div>

    <div class="col-sm-3">
        <div class="card-header">
            Les chiffres clés
        </div>
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Special title treatment</h5>
                <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
                <a href="#" class="btn btn-primary">Go somewhere</a>
            </div>
        </div>
    </div>`

    body = document.getElementById("vis3");
    body.innerHTML = `<div id="linechart"></div>`

    body = document.getElementById("vis2");
    body.innerHTML = ` <div class="card-body" >
    <div id="corr_viz"></div>
    </div>
    <div class="card-footer text-muted">
        <div class="row">
            <div class="col-sm-6">
                <label for="customRange3" class="form-label"></label>
                <div class="slider">
                    <label>Heure de l'observation sélectionné : </label><p id="rangeValue">8</p>
                    <input type="range" min="8" max="20" value="8" id="sliderCorr"
                        oninput="rangeValue.innerText = this.value">
                </div>
            </div>
            <div class="col-sm-6">
            </br><label>Quel article voulez-vous observer? </label><select class="form-select" id="aricleName" onchange="LoadBakeryAndDrawV2Bis()" aria-label="Default select example"></select>
            </div>
        </div>
    </div>`

    body = document.getElementById("vis1");
    body.innerHTML = `<div class="card-body">
    <div id="number_clients"></div>
    </div>
    <div class="card-footer text-muted">
        <p>
            <label for="amount">Intervalle choisi:</label>
            <input type="text" id="amount" style="border: 0; color: #FF0000; font-weight: bold;"
                size="100" />
        </p>

        <div id="slider-range"></div>
    </div>`
}

function displayMode(mode) {
    if (mode == 0) {
        init()
        LoadBakeryAndDrawV1()
        LoadBakeryAndDrawV2V3()
        LoadBakeryAndDrawV4()
    } else {
        const vis1 = document.getElementById("vis1");
        const vis2 = document.getElementById("vis2");
        const vis3 = document.getElementById("vis3");
        const vis4 = document.getElementById("vis4");
        const display = `NOT HERE YET`;
        vis1.innerHTML = `<img src="https://simon-klop.github.io/Data-Viz/assets/img/vis1-proto.jpg" alt="proto1" width="1000" height="1000">`
        vis2.innerHTML = display
        vis3.innerHTML = display
        vis4.innerHTML = `<div class="card text-center w-100">` + display + `</div>`
    }
};