import http from 'node:http';
import { http as mswHttp, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
    mswHttp.get('http://exmaple.com/*', async({ request }) => {
        console.log('received', request.url);
        return HttpResponse.json({});
    }),
];

const server = setupServer(...handlers);
server.listen();

const agent = new http.Agent({
    keepAlive: true,
});

const sockets = new Set();
const sendRequest = async(id) => {
    console.log(`create request for id=${id}`);

    const res = await new Promise(resolve => {
        const req = http.request(`http://exmaple.com/${id}`, { agent },  (res) => {
            resolve(res.body);
        });
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        req.once('socket', (socket) => {
            sockets.add(socket);
            console.log(sockets.size, 'unique sockets used');
            
            if (socket.connecting) {
                socket.once('connect', () => {
                    console.log(`socket for id=${id} connected`);
                    req.end();
                });
            }
            else {
                req.end();
            }
        });
    });
    return res;
}

const subscriptions = await Promise.all([
    sendRequest('1'),
    sendRequest('2'),
    sendRequest('3'),
]);

console.log(subscriptions);
