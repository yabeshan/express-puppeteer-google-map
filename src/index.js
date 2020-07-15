const express = require("express")
const puppeteer = require('puppeteer')
const PORT = process.env.PORT || 3000

const app = express()

app.get("/", (request, response) => 
	render(request)
		.then( html => response.send(html) )
		.catch( html => response.send(html) )
)

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

const render = request => 
	new Promise((resolve, reject) => {
		let from = request.query.from;
		let to = request.query.to;
		if (!from || !to) {
			resolve(header)
		}

		(async () => {
			const browser =  await puppeteer.launch({
				'args' : [
					'--no-sandbox',
					'--disable-setuid-sandbox'
				]
			});
			const page = await browser.newPage();
			await page.goto('https://www.google.com/maps/dir/'+from+'/'+to+'/');
			await page.setViewport({width: 1000, height: 800})
			// await page.waitFor(3000);
			await page.waitForSelector('.section-directions-trip-duration');
			const result = await page.evaluate(() => {
					let time = [];
					let elements = document.querySelectorAll('.section-directions-trip-duration');
					for (var element of elements){
							time.push(element.innerText);
							time.push("<br/>");
					}

					let dist = [];
					elements = document.querySelectorAll('.section-directions-trip-distance');
					for (var element of elements){
						dist.push(element.innerText);
						dist.push("<br/>");
					}

					let trip = [];
					elements = document.querySelectorAll('.section-directions-trip-title');
					for (var element of elements){
						trip.push(element.innerText);
						trip.push("<br/>");
					}

					return [...time, "======<br/>", ...dist, "======<br/>", ...trip];
			});
			const base64 = await page.screenshot({ encoding: "base64" })
			browser.close();
			resolve( header + result + `<img src="data:image/png;base64, `+base64+`" width="500" height="400" />`);
		})();
	})


const header = `
	<input id="from" placeholder="From" value="Chicago">
	<input id="to" placeholder="To" value="Toronto">
	<button onclick="go()">GO</button><br/><br/>
	<script>
		const go = () => {
			const from = document.getElementById('from').value;
			const to = document.getElementById('to').value;
			const link = '/?from='+from+'&to='+to;
			window.location = link;
		}
		const getCity = val => {
			return decodeURIComponent( val.substr( val.indexOf('=')+1 ))
		}
		( () => {
			const arr = window.location.search.split('&');
			arr.forEach( val => {
				if (val.length>0) {
					if (val.indexOf('from=')>=0)
						document.getElementById('from').value = getCity(val)
					if (val.indexOf('to=')>=0)
						document.getElementById('to').value = getCity(val)
				}
			})
		})()
</script>
`
