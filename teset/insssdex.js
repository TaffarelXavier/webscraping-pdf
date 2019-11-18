const https = require("https");
const pdfreader = require("pdfreader");

//https://cdn.cebraspe.org.br/concursos/ABIN_17/arquivos/378_ABIN_015_07_ADAPTADA.PDF

async function bufferize(url) {
  var hn = url.substring(url.search("//") + 2);
  hn = hn.substring(0, hn.search("/"));
  var pt = url.substring(url.search("//") + 2);
  pt = pt.substring(pt.search("/"));
  const options = { hostname: hn, port: 443, path: pt, method: "GET" };

  return new Promise(function(resolve, reject) {
    var buff = new Buffer.alloc(0);
    const req = https.request(options, res => {
      res.on("data", d => {
        buff = Buffer.concat([buff, d]);
      });
      res.on("end", () => {
        //console.log(buff.toString())
        resolve(buff);
      });
    });
    req.on("error", e => {
      console.error("https request error: " + e);
    });
    req.end();
  });
}

/*
if second param is set then a space ' ' inserted whenever text 
chunks are separated by more than xwidth 
this helps in situations where words appear separated but
this is because of x coords (there are no spaces between words) 

each page is a different array element
*/
async function readlines(buffer, xwidth) {
  return new Promise((resolve, reject) => {
    var pdftxt = new Array();
    var pg = 0;
    var result;
    new pdfreader.PdfReader().parseBuffer(buffer, function(err, item) {
      if (err) console.log("pdf reader error: " + err);
      else if (!item) {
        pdftxt.forEach(function(a, idx) {
          pdftxt[idx].forEach(function(v, i) {
            pdftxt[idx][i].splice(1, 2);
          });
        });
        resolve(pdftxt);
      } else if (item && item.page) {
        pg = item.page - 1;
        pdftxt[pg] = [];
      } else if (item.text) {
        var t = 0;

        var sp = "";

        //         var regex = /^\d+/gims;

        //         result = item.text.split(regex).filter(el => {
        //           return el !== "" ? el : false;
        //         });

        //         var enuciado = result[0];

        //         //console.log(enuciado.split("\n"))

        //         if(enuciado !== undefined){
        //          // pdftxt[pg].push([enuciado, item.y, item.x]);
        //         }
        //         //console.log()
        // console.log(item.text)

        pdftxt[pg].forEach(function(val, idx) {
          if (val[1] == item.y) {
            if (xwidth && item.x - val[2] > xwidth) {
              sp += " ";
            } else {
              sp = "";
            }
            pdftxt[pg][idx][0] += sp + item.text;
            t = 1;
          }
        });

        if (t == 0) {
          pdftxt[pg].push([item.text, item.y, item.x]);
        }
      }
    });
  });
}

(async () => {
  var url =
    "https://arquivo.pciconcursos.com.br/provas/26213120/98c94c8f7f53/gabarito_preliminar.pdf";
  var buffer = await bufferize(url);
  var lines = await readlines(buffer);
  //lines = await JSON.parse(JSON.stringify(lines));
  //var regex = /^\d+/gims;
  //var data = lines.join("").split(regex);
  //console.log(data[0]);
  console.log(lines)
})();
