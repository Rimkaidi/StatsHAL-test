import {appUrl} from './modules/appUrl.js';

const config = {
    topWord: 40,
    minFont: 12,
    maxFont: 25,
    tickFont: 12,
    legendFont: 12,
    curve: d3.curveMonotoneX
};
let dataForVis = [], words=[], svg = d3.select("#canvas").append('svg').attr("id", "mainSVG"),
    margins = {t:10,b:10,l:10,r:10},
    dateField= 'publicationDate_s',
    pUrl = new appUrl({'url':new URL(document.location)}),
    q = pUrl.params && pUrl.params.has('q') ? pUrl.params.get('q') : 'authIdHal_s:samuel-szoniecky',
    uri = "https://api.archives-ouvertes.fr/search/?q="+q
        +"&rows=10000"
        +"&fl=authIdHal_s,keyword_s,title_s,docid,uri_s,producedDate_s,publicationDate_s"
        +"&sort="+dateField+" asc";
//d3.json(uri,data=>{
d3.json(uri).then(data=>{
    console.log(data);
    /*
    d3.select('#rows').selectAll('p').data(rs.response.docs).enter()
    .append('p').html(r=>{
        return '"'+r.title_s[0]+'";'+r.producedDate_s.split('-')[0];
    });
    */
    dataForVis = getDataForVis(data.response.docs);
    let w = window.innerWidth-margins.l-margins.r, h = window.innerHeight - margins.t - margins.b;
    d3.select("#canvas")
        .style("max-width", w + "px")
        .style("background-color","black");    
    svg.attr("width", Math.max(120 * dataForVis.length, w))
    svg.attr("height", Math.max(200 * Object.keys(dataForVis[0].words).length, h));
    wordstream(svg, dataForVis, config);
    hideLoader();

});
function getDataForVis(data){
    dataForVis=[];
    /*
    let g = d3.nest()
        .key(function(d){
            return d.producedDate_s.split('-')[0];
        })
        .entries(data);
    g.forEach(date=>{
        let o = {'date':date.key,'words':{'keyword':[],'title':[]},'docs':[]};
        date.values.forEach(d=>{
    */
    let g = d3.group(data, d => d[dateField].split('-')[0]),
        wCat = getWordCat(data);
    g.forEach((docs,date)=>{
        let o = {'date':date,'words':JSON.parse(JSON.stringify(wCat)),'docs':[]};
        docs.forEach(d=>{
            o.docs.push(d);
            if(!d.authIdHal_s)d.authIdHal_s=["No IdHal"];
            d.authIdHal_s.forEach(ka=>{
                if(d.keyword_s) d.keyword_s.forEach(kw=>{
                    if(kw)setWord(kw,o,date,'keywords for '+ka,d,3)
                });
                let ekw = nlp(cleanText(d.title_s.join())),
                terms = ekw.terms().json();
                terms.forEach(t=>{
                    if(t.text)setWord(t.text,o,date,'keywords for '+ka,d);
                })    
            })
        })
        dataForVis.push(o)
    })
    return dataForVis;
}
function getWordCat(data){
    let w={}, cat = d3.group(data, d => d.authIdHal_s ? d.authIdHal_s : ["No IdHal"]);
    cat.forEach((v,k)=>{
        k.forEach(a=>{
            if(!w['keywords for '+a]){
                w['keywords for '+a]=[];
                //w['title for '+a]=[];        
            }
        });
    });
    return w;
}
function cleanText(t){
    t = t.replace(/.'/, '')
    .replace(/.’/, '')
    .replace(/.'/, '')
    .replace(/.’/, '')               
    .replace(/[.,\/#!,«»$%\^&\*;:{}=\-_`~()"َّ"]/mg," ")
    .replace(/\.\s+|\n|\r|\0/mg,' ')
    .replace(/\s-+\s/mg,' ')
    .replace(/[©|]\s?/mg,' ')
    .replace(/[!(–?$”“…]/mg,' ')
    .replace(/\s{2,}|^\s/mg,' ');
    t = sw.removeStopwords(t.split(' '),sw.fra);
    t = sw.removeStopwords(t,sw.eng);
    
    return t.join(' ');
}

function setWord(w,o,k,t,d,p=1){
    //console.log(t);
    let fi, aw = o.words[t].filter(d=>d.text==w);
    if(aw.length==0){
        fi = words.findIndex(d=>d==w);
        if(fi<0){
            words.push(w);
            fi = (words.length-1)*p;
        }
        o.words[t].push({frequency: 1,id: k+"_"+t+"_"+fi,text:w,topic:t,'d':d})
    }else
        aw[0].frequency = aw[0].frequency+(1*p);
}
function showLoader() {
	d3.select("#ws-loading").style("display", "inline-block")
}
function hideLoader() {
	d3.select("#ws-loading").style("display", "none")
}
