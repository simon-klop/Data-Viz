//------------------------------- VIZ 1 OK-----------------------------------------
function BakeryViz1(dataset) {
    // VIS LEFT - CLIENTS BY TIME:
    const margin = ({ top: 35, right: 70, bottom: 35, left: 70 })
    const w = 1000
    const h = 400

    const svg = d3.select("#number_clients").append("svg").attr("height", h).attr("width", w)

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
        .text("Nombre de clients");

    // X axis range init (dynamic)
    var x = d3.scaleTime().range([margin.left, w - margin.left - margin.right])
    var xAxis = svg.append("g").attr("transform", `translate(0,${h - margin.bottom})`)

    // Y axis range init (dynamic)
    var y = d3.scaleLinear().range([h - margin.bottom, 0 + margin.top])
    var yAxis = svg.append("g").attr("transform", `translate(${margin.left},0)`)


    //-----------------------
    // VIS RIGHT - MEAN TIME:
    const margin_r = ({ top: 10, right: 10, bottom: 35, left: 50 })
    const w_r = 400
    const h_r = 400

    const svg_by_hours = d3.select("#number_clients_hours").append("svg").attr("height", h_r).attr("width", w_r)

    // X label
    svg_by_hours.append('text')
        .attr('x', w_r / 2)
        .attr('y', h_r)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text('Heure')

    // Y label
    svg_by_hours.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(20,' + h / 2 + ')rotate(-90)')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text("Nombre de clients");

    // X axis init (static) 
    var x_r = d3.scaleBand()
        .range([margin_r.left, w_r])
        .domain([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
        .padding(0.1);

    svg_by_hours.append("g")
        .attr("transform", `translate(0,${h_r - margin_r.bottom})`)
        .call(d3.axisBottom(x_r))

    // Y axis init (dynamic)
    var y_r = d3.scaleLinear().range([h_r - margin_r.bottom, margin_r.top])
    var y_r_Axis = svg_by_hours.append("g").attr("transform", `translate(${margin_r.left},0)`)

    // create a tooltip
    var Tooltip = d3.select("#number_clients_hours")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    function update(nbBins, startDate, endDate) {
        // VIS LEFT :
        var essai = d3.scaleTime().domain([startDate, endDate])

        const binX = d3.bin().domain(essai.domain()).thresholds(essai.ticks(nbBins))
        var datasettime = dataset.filter(s => s.date >= startDate && s.date <= endDate)
        const bucketsX = binX(datasettime.map(d => d.date))


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





        // VIS RIGHT :

        // Cleaning of the rects
        svg_by_hours.selectAll("rect").remove()

        number_of_day = d3.groups(datasettime, d => d.date).length
        groupData = d3.groups(datasettime, d => d.hours, d => d.ticket_number)


        // Y axis update
        y_r.domain(d3.extent(groupData, d => d[1].length / number_of_day))
        y_r_Axis.transition()
            .duration(1000)
            .call(d3.axisLeft(y_r))

        // Rect drawing
        svg_by_hours.selectAll("mybar")
            .data(groupData)
            .enter()
            .append("rect")
            .attr("x", function (d) { return x_r(d[0]) })
            .attr("y", function (d) { return y_r(d[1].length / number_of_day); })
            .attr("width", x_r.bandwidth())
            .attr("height", function (d) { return h_r - y_r(d[1].length / number_of_day) - margin_r.bottom; })
            .style("fill", "red")
            .on('mouseover', function (d, i) {
                Tooltip.style("opacity", 1)
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '.80')

            })
            .on("mousemove", function (d, f) {
                Tooltip
                    .html("En moyenne, il y a " + d[1].length / number_of_day + " clients à " + d[0] + " heures")
                    .style("left", (d3.mouse(this)[0]) - 300 + "px")
                    .style("top", (d3.mouse(this)[1]) + 10 + "px")
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


    //FIRST INIT
    let initStartDate = d3.min(dataset.map(d => d.date))
    let initEndDate = d3.max(dataset.map(d => d.date))
    update(30, initStartDate, initEndDate) // 30 Buckets

    //DYNAMIC (better with JQuery slider)
    const minDate = d3.min(dataset.map(d => d.date))
    const maxDate = d3.max(dataset.map(d => d.date))
    const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    $("#slider-range").slider({
        range: true,
        min: new Date(minDate).getTime() / 1000,
        max: new Date(maxDate).getTime() / 1000,
        step: 86400,
        values: [new Date(minDate).getTime() / 1000, new Date(maxDate).getTime() / 1000],
        slide: function (event, ui) {
            $("#amount").val((new Date(ui.values[0] * 1000).toLocaleDateString("fr-FR", options)) 
                + " - " + (new Date(ui.values[1] * 1000)).toLocaleDateString("fr-FR", options))
        },
        change: function (event, ui) {
            let arr = document.getElementById("amount").value.split(" - ")
            let dates = arr.map(d => d.split(" ")[1])
            let parseTime = d3.timeParse("%d/%m/%Y");
            let startDate = parseTime(dates[0])
            let endDate = parseTime(dates[1])
            update(30, startDate, endDate)
        }
    })


    $("#amount").val((new Date($("#slider-range").slider("values", 0) * 1000).toLocaleDateString("fr-FR", options)) +
        " - " + (new Date($("#slider-range").slider("values", 1) * 1000)).toLocaleDateString("fr-FR", options))

}



//-----------------VIZ 2 ---------------------
function getFrequentItemCorr(dataset, hour_value) {
    let opti = d3.groups(dataset, d => d.ticket_number)

    articles = getArticles(dataset)

    let corr_articles = articles.map(function (a) {
        let filtrage = opti.filter(d => d[1].map(k => k.article).includes(a) && d[1].map(k => k.hours).includes(hour_value))
        let nb_tickets = filtrage.length
        let liste_achats = filtrage.map(d => d[1].map(k => k.article))
        let arr = []
        liste_achats.forEach(array =>{ arr = arr.concat(array)})
        arr = arr.sort()
        let stat = d3.rollup(arr, v => v.length / nb_tickets, d => d)

        //handle the pairs(example: several croissants in the same ticket)
        //we remove the duplicates on the tickets to keep the value of remaining article
        let pair = stat.get(a) - 1
        if (pair == 0) {
            stat.delete(a)
        }
        else {
            stat.set(a, pair)
        }

        return [a, stat]
    })
    return corr_articles

}

function getArticles(dataset) {
    let articles = [];
    d3.groups(dataset, d => d.article).map(
        article => !articles.includes(article[0]) ? (articles.push(article[0])) : console.log()
    )
    return articles.sort()
}

function BakeryViz2(dataset) {

    // Static Part
    const margin = ({ top: 10, right: 250, bottom: 30, left: 100 })
    const w = 1000
    const h = 400
    const svg = d3.select("#corr_viz").append("svg").attr("height", h).attr("width", w)

    var zoom = false
    const list = document.getElementById("best_offers");

    const max_corr = 0.6
    var myColor = d3.scaleLinear().domain([0.01, max_corr]).range(["#f4cccc", "#cc0000"])

    const select = document.getElementById("aricleName");
    var contenu = `<option selected>Tous les articles</option>`;
    const article = d3.group(dataset, d => d.article);
    for (let key of article.keys()) {
        contenu += `<option value="${key}">${key}</option>`
    }
    select.innerHTML = contenu;

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

    //Dynamic Part
    function update(zoom, changed_hour) {

        // Cleaning of the SVG
        svg.selectAll("rect").remove()
        svg.selectAll("g").remove()


        if (!zoom) {
            //Computation with the value of the slider
            hour_value = Number(document.getElementById("sliderCorr").value)
            data = getFrequentItemCorr(dataset, hour_value)

            x = data.map(d => d[0])
            y = data.map(d => Array.from(d[1]).reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {}))

            let maxValues = y.map(Object.values).flat().sort().filter(function (value) {
                return !isNaN(value);
            }).slice(-5)[0]

            const offers = []

            for (let i = 0; i < x.length; i++) {
                for (let j = 0; j < x.length; j++) {
                    svg.append("rect")
                        .attr('x', 100 + i * 90)
                        .attr('y', 67 + 30 * j)
                        .attr('width', 90)
                        .attr('height', 30)
                        .attr('fill', function () { return myColor(y[i][x[j]]) })
                        .on('mouseover', function (d, i) {
                            Tooltip.style("opacity", 1)
                            d3.select(this).transition()
                                .duration('50')
                                .attr('opacity', '.80')

                        })
                        .on("mousemove", function (d, f) {
                            let value_frequent = y[i][x[j]] * 100

                            Tooltip.html(function () {
                                if (value_frequent > 0) {
                                    return "Lorsque qu'un client achète " + x[i] + " à " + hour_value + " heure, il achète avec " + x[j] + " dans " + y[i][x[j]] * 100 + "% des cas"
                                }
                                else {
                                    return "Lorsque " + x[i] + " est acheté à " + hour_value + " heure, les clients n'achètent pas en plus " + x[j]
                                }
                            })
                                .style("left", (d3.mouse(this)[0]) + 100 + "px")
                                .style("top", (d3.mouse(this)[1]) + 100 + "px")
                        })

                        .on('mouseout', function (d, i) {
                            Tooltip
                                .style("opacity", 0)
                            d3.select(this).transition()
                                .duration('50')
                                .attr('opacity', '1')
                        })

                    if (y[i][x[j]] >= maxValues) {
                        offers.push(x[i] + ' + ' + x[j])
                    }
                }
            }


            // Axe X
            svg.append("g").selectAll("text").data(x).enter()
                .append("text")
                .attr("x", (d, i) => margin.left + i * 90)
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
            let space_divisor = (w - margin.left) / ((max_corr * 10) + 1)
            svg.append("g").selectAll("text").data(d3.range(0, max_corr, 0.1)).enter()
                .append("rect")
                .attr('x', (d, i) => (margin.left + space_divisor) + space_divisor * i)
                .attr('y', 380)
                .attr('width', space_divisor)
                .attr('height', 10)
                .attr('fill', function (d) { return myColor(d) })

            svg.append("g")
                .append("rect")
                .attr('x', (d, i) => margin.left)
                .attr('y', 380)
                .attr('width', space_divisor)
                .attr('height', 10)
                .attr('fill', 'black')

            // Legend info
            svg.append("g").selectAll("text").data(d3.range(0, max_corr * 100 + 10, 10)).enter()
                .append("text")
                .attr('x', (d, i) => (margin.left + space_divisor) + space_divisor * i)
                .attr('y', 400)
                .text(d => d + "%")
                .attr("font-size", "10px")

            svg.append("g")
                .append("text")
                .attr('x', (d, i) => margin.left)
                .attr('y', 400)
                .attr("font-size", "10px")
                .text("Pas acheté ensemble")


            contenu = ``
            for (let i = 0; i < offers.length; i++) {
                contenu += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary rounded-pill">Top ${i + 1}</span>
                    ${offers[i].toLowerCase()}
                    </li>`
            }
            list.innerHTML = contenu;
        } else {
            svg.selectAll("text").remove()

            //Computation with the value of the slider
            hour_value = Number(document.getElementById("sliderCorr").value)
            product = document.getElementById("aricleName").value

            if (changed_hour)
                data = getFrequentItemCorr(dataset, hour_value)

            y_arr = data.map(d => Array.from(d[1]).reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {}))[articles.indexOf(product)]


            // y_arr[product] =  y_arr[product] - 1

            y = Object.entries(y_arr).sort((a, b) => b[1] - a[1]).reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {})


            x = Object.keys(y)

            item = x.indexOf(product)

            for (let i = 0; i < x.length; i++) {
                svg.append("rect")
                    .attr('x', 100)
                    .attr('y', 67 + 30 * i)
                    .attr('width', 900)
                    .attr('height', 30)
                    .attr('fill', function () { return myColor(y[x[i]]) })
                    .on('mouseover', function (d, i) {
                        Tooltip.style("opacity", 1)
                        d3.select(this).transition()
                            .duration('50')
                            .attr('opacity', '.80')

                    })
                    .on("mousemove", function (d, f) {
                        Tooltip
                            .html("Lorsqu'un/une " + product + " est acheté/e, on achète un/une " + x[i] + " avec " + y[x[i]] * 100 + "% du temps à " + hour_value + " heure")
                            .style("left", (d3.mouse(this)[0]) + 100 + "px")
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

            // Axe Y
            svg.append("g").selectAll("text").data(x).enter()
                .append("text")
                .attr("x", d => 10)
                .attr("y", (d, i) => 75 + i * 30)
                .text(d => d)
                .attr("font-size", "8px")

            // Legend 
            svg.append("g").selectAll("text").data(d3.range(0, max_corr, 0.1)).enter()
                .append("rect")
                .attr('x', (d, i) => 100 + 148 * i)
                .attr('y', 380)
                .attr('width', 400)
                .attr('height', 10)
                .attr('fill', function (d) { return myColor(d) })

            // Legend info
            svg.append("g").selectAll("text").data(d3.range(0, max_corr * 100 + 10, 10)).enter()
                .append("text")
                .attr('x', (d, i) => 100 + 148 * i)
                .attr('y', 400)
                .text(d => d)
                .attr("font-size", "10px")

            // Titre
            svg.append("text")
                .attr("x", 5)
                .attr("y", margin.top + 5)
                .text("Produits les plus vendus avec un/une " + product + " à " + hour_value + " heure")

        }


    }
    // first init
    update(zoom, false)

    // DYNAMIC
    d3.select("#sliderCorr").on("change", function () {
        update(zoom, true)
    })

    d3.select("#aricleName").on("change", function () {

        const checked = document.getElementById("aricleName");

        if ("Tous les articles" != checked.value && !zoom) {
            zoom = true
            update(zoom, false)
        } else if ("Tous les articles" == checked.value && zoom) {
            zoom = false
            update(zoom, false)
        } else {
            update(zoom, true)
        }


    })
}

//-----------------VIZ 3---------------------

function BakeryViz3(dataset) {

    const margin = ({ top: 10, right: 210, bottom: 30, left: 60 })

    const w = 1000
    const h = 650

    const svg = d3.select("#linechart").append("svg").attr("height", h).attr("width", w)

    const select = document.getElementById("linechart-options");

    var contenu = ``;
    const article = d3.group(dataset, d => d.article);
    for (let key of article.keys()) {
        contenu += `<input class="form-check-input" type="checkbox" id="vis3-${key.split(' ')[0]}" checked>
                    <label class="form-check-label" for="vis3-${key.split(' ')[0]}">${key.toLowerCase()}</label></br>`
    }
    select.innerHTML = contenu;

    const c = d3.scaleOrdinal().domain(
        new Set(dataset.map(d => d.article))).range(["red", "green", "blue", "purple", "orange", "black", "grey", "brown", "pink", "#FF8C00"])

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


    function update() {

        svg.selectAll("rect").remove()
        svg.selectAll("g").remove()
        svg.selectAll("text").remove()
        svg.selectAll("path").remove()
        svg.selectAll("circle").remove()

        var dataset_filtre = dataset
        for (let key of article.keys()) {

            if (!document.getElementById("vis3-" + key.split(' ')[0]).checked) {
                dataset_filtre = dataset_filtre.filter(function (d) { return d.article != key })
            }
        }

        const MapQuantityByHours = d3.rollup(dataset_filtre, v => d3.sum(v, d => d.Quantity), d => d.hours, d => d.article)
        const index_hours = d3.groups(dataset_filtre, d => d.hours)
        const number_of_day = d3.groups(dataset_filtre, d => d.date).length
        const index_article = d3.groups(dataset_filtre, d => d.article)
        const group_points = index_hours.map(h =>
            index_article.map(a =>
                JSON.parse(
                    '{"Hours":' + h[0] + ', "Article":"' + a[0] + '", "Counts":' +
                    ((MapQuantityByHours.get(h[0]).get(a[0]) != undefined) ?
                        MapQuantityByHours.get(h[0]).get(a[0]) : 0) / number_of_day
                    + '}')
            )
        )


        var points = []
        for (let i = 0; i < group_points.length; i++) {
            points = points.concat(group_points[i])
        }
        points = points.slice().sort((a, b) => d3.ascending(a.Hours, b.Hours))

        var list = document.getElementById("linechart-total");
        contenu = ``
        for (let key of d3.group(dataset_filtre, d => d.article).keys()) {
            var total = 0
            for (let i = 0; i < group_points.length; i++) {
                total += group_points[i].filter(function (d) { return d.Article == key })[0].Counts
            }
            contenu += `<li class="list-group-item d-flex justify-content-between align-items-center">${key}
                            <span class="badge bg-primary rounded-pill">${Math.ceil(total)}</span>
                        </li>`
        }
        list.innerHTML = contenu;

        const x = d3.scaleLinear().domain(d3.extent(points, d => d.Hours)).range([margin.left, w - margin.left - margin.right])
        const y = d3.scaleLinear().domain(d3.extent(points, d => d.Counts)).range([h - margin.bottom, margin.top])

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
            .text("Nombre de produit acheté en moyenne");

        // cercle de couleur : Point
        svg.selectAll("circle").data(points).enter()
            .append("circle")
            .attr("cx", d => x(d.Hours))
            .attr("cy", d => y(d.Counts))
            .style("fill", d => c(d.Article))
            .on('mouseover', function (d, i) {
                Tooltip.style("opacity", 1)
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '.50')

            })
            .on('mouseout', function (d, i) {
                Tooltip.style("opacity", 0)
                d3
                    .select(this).transition()
                    .duration('50')
                    .attr('opacity', '1')
            })
            .on("mousemove", function (d, f) {
                Tooltip
                    .html("En moyenne, on vend à " + d.Hours + " heures, " + d.Counts + " " + d.Article)
                    .style("left", (d3.mouse(this)[0]) + "px")
                    .style("top", (d3.mouse(this)[1]) - 75 + "px")

            })
            .attr("r", d => 0)
            .transition()
            .duration(500)
            .attr("r", d => 4)

        // lines
        const group_point = d3.groups(points, d => d.Article)

        const lines = group_point.map((group) => {
            return group[1].map((d) => {
                return {
                    Hours: d.Hours,
                    Counts: d.Counts,
                    Article: d.Article
                }
            })
        })

        const line = d3.line()
            .x(d => x(d.Hours))
            .y(d => y(d.Counts))

        svg.selectAll(".line")
            .data(lines)
            .enter()
            .append("path")
            .attr("stroke", (d) => c(d[0].Article))
            .attr("fill", "none")
            .attr("stroke-width", 1.5)
            .attr("d", (d) => line(d))

        // LEGENDE :

        // Titre
        svg.append("text")
            .attr("x", w - margin.right - 200)
            .attr("y", margin.top + 5)
            .text("Nombre de produits acheté/h")

        // rect couleur
        svg.selectAll("rect").data(c.domain()).enter()
            .append("rect")
            .attr("x", d => w - margin.right - 190)
            .attr("y", (d, i) => i * 20 + margin.top + 20)
            .attr("width", d => 10)
            .attr("height", d => 10)
            .style("fill", d => c(d))

        // Nom d'article
        svg.append("g").selectAll("text").data(c.domain()).enter()
            .append("text")
            .attr("x", d => w - margin.right - 175)
            .attr("y", (d, i) => i * 20 + 10 + margin.top + 20)
            .text(d => d)
    }

    update()

    // DYNAMIC
    d3.select("#linechart-options").on("click", function () {
        update()
    })
}

//-----------------VIZ 4---------------------

function invertJson(jsonData) {
    var result = { name: 'ingredients' };
    var children = [];

    jsonData.children.forEach(function (patisserie) {
        patisserie.children[0].children.forEach(function (ingredient) {
            var existingChild = children.find(function (c) { return c.name === ingredient.name; });
            if (existingChild) {
                existingChild.children.push({
                    name: patisserie.name, size: ingredient.size * document.getElementById(patisserie.name.split(' ')[0]).value
                });
            } else {
                children.push({ name: ingredient.name, children: [{ name: patisserie.name, size: ingredient.size * document.getElementById(patisserie.name.split(' ')[0]).value }] });
            }
        });
    });
    result.children = children;
    return result;
}

function BakeryViz4(alldata, dataset) {
    const select = document.getElementById("vis4select");
    const c = ["red", "green", "blue", "purple", "orange", "black", "grey", "brown", "pink", "#FF8C00"]

    let article = []

    var checked = document.getElementById("flexSwitchCheckChecked");

    var contenu = ``;
    for (let i = 0; i < Object.keys(dataset.children).length; i++) {
        contenu = contenu + `
        
        <div class="input-group mb-3 justify-content-end">
            <div class="input-group-text">
                    <label>${dataset.children[i].name} : </label> </br>
                    <input id=${dataset.children[i].name} type="number" min="0" value=1 max="1000">
            </div>
            
            
           
        </div>`;
        article.push(dataset.children[i].name);
    }

    var title = document.getElementById("title-vis4");
    select.innerHTML = contenu;
    const margin = ({ top: 35, right: 70, bottom: 35, left: 70 })
    const w = 750
    const h = 750
    var svg = d3.select("#pack").append("svg").attr("height", h).attr("width", w)


    //-----------------------
    // VIS RIGHT - BENEF:
    const margin_r = ({ top: 10, right: 10, bottom: 35, left: 30 })
    const w_r = 400
    const h_r = 300

    alldata_filtre = alldata.filter(function (d) { return article.includes(d.article) })
    price_by_article = d3.rollup(alldata_filtre, v => d3.mean(v, d => d.unit_price), d => d.article)

    console.log(dataset.mean_price)
    
    var prices = new Map();
    dataset.mean_price.forEach(function(item) {
        prices.set(item.name, item.price);
    })

    console.log(prices)
    price_ingred = []

    dataset.children.forEach(article => {
        var tmp = []

        article.children[0].children.forEach(ingredient => {
            console.log(ingredient.size)
            tmp.push(ingredient.name, ingredient.size * prices.get(ingredient.name));
        })
        tmp.push("total_mean_price", price_by_article.get(article.name))
        price_ingred.push([article.name, tmp])
    })



    const svg2 = d3.select("#vis4-benf").append("svg").attr("height", h_r).attr("width", w_r)

    // X axis init (static) 
    var x_r = d3.scaleBand()
        .range([margin_r.left, w_r])
        .domain(article)
        .padding(0.1);

    svg2.append("g")
        .attr("transform", `translate(0,${h_r - margin_r.bottom})`)
        .style('font-size', 8)
        .call(d3.axisBottom(x_r))
    
    // Y axis init (dynamic)
    var y_r = d3.scaleLinear()
        .range([h_r - margin_r.bottom, margin_r.top])
        .domain(d3.extent([0, d3.max(price_by_article, d => d[1])]))


    svg2.append("g").attr("transform", `translate(${margin_r.left},0)`)
    .call(d3.axisLeft(y_r))

    svg2.selectAll("mybar")
            .data(price_by_article)
            .enter()
            .append("rect")
            .attr("x", function (d) { return x_r(d[0]) })
            .attr("y", function (d) { return y_r(d[1]); })
            .attr("width", x_r.bandwidth())
            .attr("height", function (d) { return h_r - y_r(d[1]) - margin_r.bottom; })
            .style("fill", "blue")

    //Dynamic Part
    function update(checked) {

        // Cleaning of the SVG
        svg.selectAll("rect").remove()
        svg.selectAll("g").remove()
        svg.selectAll("text").remove()

        if (!checked) {
            title.innerHTML = `TITRE1`
            var stratify = d3.stratify()
                .parentId(function (d) { return d.id.substring(0, d.id.lastIndexOf(".")); });


            let facteur = document.getElementById(article[0].split(' ')[0]).value

            // Give the data to this cluster layout
            var root = d3.hierarchy(dataset, function (d) { return d.children; })
                .sum(function (d) {
                    if (d.size === undefined) {
                        let index = article.indexOf(d.name)

                        if (index > -1 && index + 1 < article.length) {
                            facteur = document.getElementById(article[index + 1].split(' ')[0]).value
                        } else {
                            if (index + 1 == article.length) {
                                facteur = document.getElementById(article[0].split(' ')[0]).value
                            }
                        }
                    } else {
                        return d.size * facteur;
                    }
                }
                ) // Here the size of each leave is given in the 'size' field in input data
                .sort(function (a, b) { return b.value - a.value; }); // Here the list of nodes is sorted by size

            // Then d3.treemap computes the position of each element of the hierarchy
            d3.treemap()
                .size([w, h])
                .paddingTop(20)
                .paddingRight(7)
                .paddingInner(3)
                (root);

            // use this information to add rectangles:
            svg
                .selectAll("rect")
                .data(root.leaves())
                .enter()
                .append("rect")
                .attr('x', function (d) { return d.x0; })
                .attr('y', function (d) { return d.y0; })
                .attr('width', function (d) { return d.x1 - d.x0; })
                .attr('height', function (d) { return d.y1 - d.y0; })
                .style("stroke", "black")
                .style("fill", function (d) { return c[article.indexOf(d.parent.parent.data.name)] })
                .append("title") // Simple tooltip
                .text(function (d) { return  d.data.name + " : " + d.value + "g"})

            // Add the text labels
            svg
                .selectAll("text")
                .data(root.leaves())
                .enter()
                .append("text")
                .attr("x", function (d) { return d.x0 + 5 })    // +10 to adjust position (more right)
                .attr("y", function (d) { return d.y0 + 15 })    // +20 to adjust position (lower)
                .text(function (d) { return d.data.name })
                .attr("font-size", "10px")
                .attr("fill", "white");

            // Add the text labels
            svg
                .selectAll("text-value")
                .data(root.leaves())
                .enter()
                .append("text")
                .attr("x", function (d) { return d.x0 + 5 })    // +10 to adjust position (more right)
                .attr("y", function (d) { return d.y0 + 25 })    // +20 to adjust position (lower)
                .text(function (d) { return d.value})
                .attr("font-size", "9px")
                .style("opacity", 0.8)
                .attr("fill", "white");

            // Add the title of article
            svg
                .selectAll("titles")
                .data(root.descendants().filter(function (d) { return d.depth == 1 }))
                .enter()
                .append("text")
                .attr("x", function (d) { return d.x0 })
                .attr("y", function (d) { return d.y0 + 20 })
                .text(function (d) { return d.data.name })
                .attr("font-size", "12px")
                .attr("fill", function (d) { return c[article.indexOf(d.data.name)] })

        } else {
            title.innerHTML = `TITRE2`
            let ingredient = []
            const invertdataset = invertJson(dataset);


            let facteur = document.getElementById(article[0].split(' ')[0]).value

            // Give the data to this cluster layout
            var root = d3.hierarchy(invertdataset, function (d) { return d.children; })
                .sum(function (d) {
                    return d.size;
                }
                ) // Here the size of each leave is given in the 'size' field in input data
                .sort(function (a, b) { return b.value - a.value; }); // Here the list of nodes is sorted by size


            for (let i = 0; i < root.children.length; i++) {
                ingredient.push(root.children[i].data.name);
            }
            // Then d3.treemap computes the position of each element of the hierarchy
            d3.treemap()
                .size([w-10, h])
                .paddingTop(20)
                .paddingRight(10)
                .paddingInner(3)
                (root);

            // use this information to add rectangles:
            svg
                .selectAll("rect")
                .data(root.leaves())
                .enter()
                .append("rect")
                .attr('x', function (d) { return d.x0; })
                .attr('y', function (d) { return d.y0; })
                .attr('width', function (d) { return d.x1 - d.x0; })
                .attr('height', function (d) { return d.y1 - d.y0; })
                .style("stroke", "black")
                .style("fill", function (d) { return c[ingredient.indexOf(d.parent.data.name)] })
                .append("title") // Simple tooltip
                .text(function (d) { return d.data.name.toLowerCase() + " : " + d.value + "g" })

            // Add the text labels
            svg
                .selectAll("text")
                .data(root.leaves())
                .enter()
                .append("text")
                .attr("x", function (d) { return d.x0 + 5 })
                .attr("y", function (d) { return d.y0 + 20 })
                .text(function (d) { return d.data.name.toLowerCase() })
                .attr("font-size", "8px")
                .attr("fill", "white");

            // Add the text labels
            svg
                .selectAll("text-value")
                .data(root.leaves())
                .enter()
                .append("text")
                .attr("x", function (d) { return d.x0 + 5 })    // +10 to adjust position (more right)
                .attr("y", function (d) { return d.y0 + 30 })    // +20 to adjust position (lower)
                .text(function (d) { return d.value})
                .attr("font-size", "7px")
                .style("opacity", 0.8)
                .attr("fill", "white");

            // Add the title of article
            svg
                .selectAll("titles")
                .data(root.descendants().filter(function (d) { return d.depth == 1 }))
                .enter()
                .append("text")
                .attr("x", function (d) { return d.x0 })
                .attr("y", function (d) { return d.y0 + 10 })
                .text(function (d) { return d.data.name.toUpperCase()+ " - " 
                + root.children[ingredient.indexOf(d.data.name)].value+ "g"})
                .attr("font-size", "10px")
                .attr("fill", function (d) { return c[ingredient.indexOf(d.data.name)] })
        }


    }

    // first init
    update(checked.checked)

    // DYNAMIC
    for (i = 0; i < article.length; i++) {
        d3.select("#" + article[i].split(' ')[0]).on("change", function () {
            checked = document.getElementById("flexSwitchCheckChecked");
            update(checked.checked)
        })
    }

    d3.select("#flexSwitchCheckChecked").on("change", function () {
        checked = document.getElementById("flexSwitchCheckChecked");
        update(checked.checked)
    })



}

// ______________________________ LOAD DATA AND OTHER FUNCTION ______________________________

var stateVis2 = false;
LoadBakeryAndDrawV1V2V3()

function conversor1(d) {
    d.ticket_number += d.ticket_number
    d.Quantity = +d.Quantity
    d.unit_price = +d.unit_price
    d.datetime = d3.timeParse("%Y-%M-%d:%H:%M")(d.date + ":" + d.time)
    d.weekday = d.datetime.getDay()
    d.hours = d.datetime.getHours()
    d.month = d.datetime.getMonth()
    const parseTime = d3.timeParse("%Y-%m-%d");
    d.date = parseTime(d.date)
    return d
}

async function LoadBakeryAndDrawV1V2V3() {
    d3.csv(
        "https://simon-klop.github.io/Data-Viz/Bakery_cleaned2.csv",
        conversor1,
        function (data) {
            BakeryViz1(data),
            BakeryViz2(data),
            BakeryViz3(data), 
            LoadBakeryAndDrawV4(data)
        })
}


async function LoadBakeryAndDrawV4(dataset) {
    d3.json(
        "https://simon-klop.github.io/Data-Viz/receipts.json",
        function (data) {
            BakeryViz4(dataset, data)
        })
}


function init() {
    var body = document.getElementById("vis4");

    body.innerHTML = `<div class="col-sm-3">
    <div class="card">
        <div class="card-header">
            Sélectionnez un mode d'affichage : 
        </div>
        <div class="card-body">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="flexSwitchCheckChecked">
                <label class="form-check-label" for="flexSwitchCheckChecked">Focus sur les ingredients</label>
              </div>
        </div>
    </div></br></br>
    <div class="card">
        <div class="card-header">
            Quel/combien d'article souhaitez-vous produire? 
        </div>
        <div class="card-body" id="vis4select"></div>
    </div>
</div>

<div class="col-sm-7">
    <div class="card">
        <div id="title-vis4" class="card-header"></div>
        <div class="card-body">
            <div id="pack"></div>
        </div>
    </div>
</div>`

    body = document.getElementById("vis3");
    body.innerHTML = `
    <div class="col-sm-2">
                <div class="card">
                    <div class="card-header">
                        Sélectionnez les articles que vous souhaitez observer :
                    </div>
                    <div class="card-body">
                        <div id="linechart-options"></div>
                    </div>
                </div></br></br>
                
            </div>

            <div class="col-sm-7">
                <div class="card">
                    <div class="card-header">
                        Nombre moyen d'article en moyenne par heure
                    </div>
                    <div class="card-body">
                        <div id="linechart"></div>
                    </div>
                </div>
            </div>
            
            <div class="col-sm-3">
                <div class="card">
                    <div class="card-header">
                        Total par jour
                    </div>
                    <div class="card-body">
                        <ul class="list-group" id="linechart-total"></ul>
                    </div>
                </div>
            </div>`

    body = document.getElementById("vis2");
    body.innerHTML = ` 
    <div class="col-sm-9">
                <div class="card">
                    <div class="card-header">
                        TO DO TITLE
                    </div>
                    <div class="card-body">
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
                            </br><label>Quel article voulez-vous observer? </label><select class="form-select" id="aricleName" aria-label="Default select example"></select>
                            </div>
                        </div>
                    </div>
        
                    <div class="card-body" >
                        <div id="corr_viz"></div>
                    </div>
                </div>
            </div>

            <div class="col-sm-3">
                <div class="card">
                    <div class="card-header">
                        Offres les plus pertinentes :
                    </div>
                    <div class="card-body"  id="best_offers">
                    </div>
                </div>
            </div>`

    body = document.getElementById("vis1");
    body.innerHTML = `<div class="row justify-content-center"  >
    <div class="col-sm-8">
        <div class="card">
            <div class="card-header">
                Nombre de client en fonction du temps
            </div>
            <div  >
                <div class="card-body">
                    <div id="number_clients"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="card">
            <div class="card-header">
            Nombre de client en moyenne par heure
            </div>
            <div class="card-body">
                <div id="number_clients_hours"></div>
            </div>
        </div>
    </div>
</div>
<div class="card-footer text-muted">
    <p>
        <label for="amount">Intervalle choisi:</label>
        <input type="text" id="amount" style="border: 0; color: #FF0000; font-weight: bold;"
            size="100" readonly/>
    </p>

    <div class="slider-area" style="text-align:center; margin: 0px 40px 0px 40px; padding:20px; border: 1px solid rgb(255, 0, 0); background: #fffefe; border-radius: 25px;">
    <div id="slider-range"></div>
</div>`
    stateVis2 = false;
}

function displayMode(mode) {
    if (mode == 0) {
        init()
        LoadBakeryAndDrawV1V2V3()
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