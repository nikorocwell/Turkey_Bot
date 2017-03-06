var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

const needle = require("needle"),
    url = require('url'),
    db = require('./db'),
    jade = require('jade'),
    Users = require('mongoose').model('Users'),
    Sessions = require('mongoose').model('Sessions'),
    Protos = require('mongoose').model('ProductProtos'),
    Products = require('mongoose').model('Products'),
    Orders = require('mongoose').model('Orders'),
    Locations = require('mongoose').model('Locations'),
    yandexMoney = require('./yandexMoney'),
    config  = require('./config'),
    bodyParser = require('body-parser'),
    nodemailer = require('nodemailer');

//create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: true });

var useEmulator = true;// (process.env.NODE_ENV = 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

//create reusable transporter object using SMTP transport
var transporter 		= nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    auth: {
        user: 'postmaster@mg.rega.site',
        pass: '188e671fd3539ccf39677c8ac19ead99'
    }
});
//setup e-mail data with unicode symbols
var mailOptions 		= {
    from:'<foodorder@rega.site>',							// sender address
    sender:'<foodorder@rega.site>',
    replyTo:'<foodorder@mg.rega.site>',
    to:'foodorder@mg.rega.site', 						// list of receivers
    cc:'foodorder@mg.rega.site',
    subject:'NEW ORDER from Индеец Гусев', 					// Subject line
    text:'NEW ORDER', 					// plaintext body
    html:'<b>Hello world from REGA</b>' 			// html body
};

var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyA8qM5dkO51c4StRFPhVcQ6RpvDIHcbK5A'
});
// googleMapsClient.geocode({
//     address: 'Яскино 9',
//     language: "ru",
//     region: 'RUS'
// },  function(err, response) {
//     if (!err) {
//         console.log(response.json.results[0].geometry.location.lat + ' lat');
//         console.log(response.json.results[0].geometry.location.lng + ' lng');
//         console.log(response.json.results[0].formatted_address + ' adr');
//         console.log(response.json.results[0].address_components);
//
//         // Locations.add({
//         //     id: 'LOC02',
//         //     description: 'Химки',
//         //     openhours: {
//         //         from: 10,
//         //         to: 20
//         //     },
//         //     address: 'ул. 9-го Мая, 10, Химки, Московская обл., Россия, 141410',
//         //     geometry: {
//         //         lat: '55.901722',
//         //         lng: '37.413846'
//         //     },
//         //     owner: {
//         //         id: 'FARM01',
//         //         name: 'Индеец Гусев'
//         //     },
//         //     picture: {
//         //         contentType: 'image/jpeg',
//         //         contentUrl: null
//         //     }
//         // }, function (err, proto) {
//         //
//         // });
//     }
// });

var bot = new builder.UniversalBot(connector, {
    localizerSettings: {
        defaultLocale: "ru"
    }
});
var phonelem;
var orderid;
var storageid = 'N/A';
var ClientCellPhone;
var addId = null;
var defcur = ' руб.';

Locations.add({
    id: 'LOC05',
    description: 'Одинцово Говорова 103',
    openhours: {
        from: 10,
        to: 20
    },
    address: 'ул. Говорова, 103, Одинцово, Московская обл., Россия, 143005',
    geometry: {
        lat: '55.6918228',
        lng: '37.2982976'
    },
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    picture: {
        contentType: 'image/jpeg',
        contentUrl: null
    }
}, function (err, proto) {

});

Locations.add({
    id: 'LOC04',
    description: 'Новокуркинское 31',
    openhours: {
        from: 10,
        to: 20
    },
    address: 'Новокуркинское ш., 31, Москва, Россия, 125466',
    geometry: {
        lat: '55.900599',
        lng: '37.3963388'
    },
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    picture: {
        contentType: 'image/jpeg',
        contentUrl: null
    }
}, function (err, proto) {

});

Locations.add({
    id: 'LOC03',
    description: 'Свободный пр., 9к4',
    openhours: {
        from: 10,
        to: 20
    },
    address: 'Свободный пр., 9к4, Москва, Россия, 111555',
    geometry: {
        lat: '55.763663',
        lng: '37.82291'
    },
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    picture: {
        contentType: 'image/jpeg',
        contentUrl: null
    }
}, function (err, proto) {

});

Locations.add({
    id: 'LOC02',
    description: 'ул. Литвина-Седого, 3',
    openhours: {
        from: 10,
        to: 20
    },
    address: 'ул. Литвина-Седого, 3, Москва, Россия, 123317',
    geometry: {
        lat: '55.761245',
        lng: '37.54251199999999'
    },
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    picture: {
        contentType: 'image/jpeg',
        contentUrl: null
    }
}, function (err, proto) {

});

Locations.add({
    id: 'LOC01',
    description: 'Мамоново',
    openhours: {
        from: 10,
        to: 20
    },
    address: 'Мамоново, Рязанская обл., Россия, 391155',
    geometry: {
        lat: '53.9960386',
        lng: '39.5764539'
    },
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    picture: {
        contentType: 'image/jpeg',
        contentUrl: null
    }
}, function (err, proto) {

});

Protos.add({
    id: 'CHEESE01',
    description: 'Сыры',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'diary',
    type: 'cheese',
    isactive: true,
    price: 450,
    forms: [
        {
            isactive: true,
            id: 'cheese011',
            name: 'Сыр Адыгейский 300 гр.',
            weightmax: 0.3,
            weightmin: 0.3
        },
        {
            isactive: false,
            id: 'cheese012',
            name: 'Сыр Козий 300 гр.',
            weightmax: 0.3,
            weightmin: 0.3
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://vita-fattoria.ru/wp-content/uploads/2015/07/%D0%A4%D0%B5%D1%80%D0%BC%D0%B5%D1%80%D1%81%D0%BA%D0%B8%D0%B5-%D0%BC%D0%BE%D0%BB%D0%BE%D1%87%D0%BD%D1%8B%D0%B5-%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D1%8B-%D1%81%D1%8B%D1%80-2.jpg'
    },
    promt: 'Выберите размер упаковки!'
}, function (err, proto) {

});

Protos.add({
    id: 'YOGURT01',
    description: 'Йогурт',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'diary',
    type: 'yogurt',
    isactive: true,
    price: 1,
    forms: [
        {
            isactive: true,
            id: 'yog200',
            name: 'Бутылка 0.5 л.',
            weightmax: 80,
            weightmin: 80
        },
        {
            isactive: true,
            id: 'yog440',
            name: 'Бутылка 0.275 л.',
            weightmax: 45,
            weightmin: 45
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://eda-iz-derevni.ru/upload/iblock/0eb/0ebe0bf2a8caf668b1cf45c2edb9a3c7.jpg'
    },
    promt: 'Выберите размер упаковки!'
}, function (err, proto) {

});

Protos.add({
    id: 'COTTAGECHEESE01',
    description: 'Творог',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'diary',
    type: 'cottagecheese',
    isactive: true,
    price: 350,
    forms: [
        {
            isactive: false,
            id: 'CC200',
            name: 'Упаковка 200 гр.',
            weightmax: 0.2,
            weightmin: 0.2
        },
        {
            isactive: false,
            id: 'CC440',
            name: 'Упаковка 440 гр.',
            weightmax: 0.44,
            weightmin: 0.44
        },
        {
            isactive: true,
            id: 'CC440',
            name: 'Упаковка 0.5 кг.',
            weightmax: 0.5,
            weightmin: 0.5
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://eda-iz-derevni.ru/upload/iblock/16d/16d9b96fe80dfd78bafa08c13f19f604.jpg'
    },
    promt: 'Выберите размер упаковки!'
}, function (err, proto) {

});

Protos.add({
    id: 'CREAMS01',
    description: 'Сметана',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'diary',
    type: 'cream',
    isactive: true,
    price: 350,
    forms: [
        {
            isactive: true,
            id: 'creampack200',
            name: 'Упаковка 200 гр.',
            weightmax: 0.2,
            weightmin: 0.2
        },
        {
            isactive: true,
            id: 'creampack440',
            name: 'Упаковка 440 гр.',
            weightmax: 0.44,
            weightmin: 0.44
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://eda-iz-derevni.ru/upload/iblock/cfe/cfe5bd53a9c61d1214843cb9dd068568.jpg'
    },
    promt: 'Выберите размер упаковки!'
}, function (err, proto) {

});

Protos.add({
    id: 'MILKS01',
    description: 'Молоко',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'diary',
    type: 'milk',
    isactive: true,
    price: 80,
    forms: [
        {
            isactive: true,
            id: 'milkbot1',
            name: 'Бутылка 1 литр',
            weightmax: 1,
            weightmin: 1
        },
        {
            isactive: true,
            id: 'milkbot15',
            name: 'Бутылка 1.5 литр',
            weightmax: 1.5,
            weightmin: 1.5
        },
        {
            isactive: true,
            id: 'milkbot3',
            name: 'Бутылка 3 литр',
            weightmax: 3,
            weightmin: 3
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://eda-iz-derevni.ru/upload/iblock/1be/1be2ff3743d9d43f220ea0d422b4f911.jpg'
    },
    promt: 'Выберите объем бутылки!'
}, function (err, proto) {

});

Protos.add({
    id: 'OILS01',
    description: 'Растительные масла',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'oils',
    type: 'oils',
    isactive: true,
    price: 1,
    forms: [{
            isactive: true,
            id: 'grechichnoeoil',
            name: 'Гречичное 0.5 л.',
            weightmax: 130,
            weightmin: 130
        },
        {
            isactive: true,
            id: 'sunfloweroil',
            name: 'Подсолнечное 0.5 л.',
            weightmax: 90,
            weightmin: 90
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://greenfood66.ru/sites/default/files/ufiles/oil-chose.jpg'
    },
    promt: 'Выберите размер пакета!'
}, function (err, proto) {

});

Protos.add({
    id: 'POTATO01',
    description: 'Картофель',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'potato',
    type: 'potato',
    isactive: true,
    price: 120,
    forms: [{
            isactive: true,
            id: 'pot2kilobag',
            name: 'Пакет 2 кг.',
            weightmax: 1,
            weightmin: 1
        },
        {
            isactive: false,
            id: 'Пакет 5 кг',
            name: '600 гр.',
            weightmax: 2.5,
            weightmin: 2.5
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://ya39.ru/upload/resize_cache/bataline.ads/5f1/445_330_1/5f19f17175ab5c198998d4a41a20e8a5.jpg'
    },
    promt: 'Выберите размер пакета!'
}, function (err, proto) {

});



Protos.add({
    id: 'CHICKEN01',
    description: 'Бройлерные цыплята',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'chicken',
    type: 'broiler',
    isactive: true,
    price: 330,
    forms: [{
            isactive: true,
            id: 'broiler1kg',
            name: 'до 1 кг.',
            weightmax: 1,
            weightmin: 1
        },
        {
            isactive: true,
            id: 'broiler25kg',
            name: 'до 2.5 кг',
            weightmax: 2.5,
            weightmin: 2.5
        },
        {
            isactive: true,
            id: 'broiler35kg',
            name: 'до 3.5 кг',
            weightmax: 3.5,
            weightmin: 3.5
        },
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://skid.by/images/products/produkty-pitaniya/myaso-ptica-subprodukty-yayca/tushka-cyplyat-broylerov-zam-1-kg_main_usy1k2.jpg'
    },
    promt: 'Выберите вес тушки цыпленка!'
}, function (err, proto) {

});


Protos.add({
    id: 'EGGS01',
    description: 'Яйца',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'eggs',
    type: 'egg',
    isactive: true,
    price: 1,
    qtymax: 10,
    forms: [{
            isactive: true,
            id: 'chickten01',
            name: 'Куриные Десяток',
            weightmax: 130,
            weightmin: 130
        },
        {
            isactive: true,
            id: 'twenty022',
            name: 'Перепелиные Десяток',
            weightmax: 60,
            weightmin: 60
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://kurskaya-oblast.doski.ru/i/67/89/678900.jpg'
    },
    promt: 'Выберите количество яиц!'
}, function (err, proto) {

});

Protos.add({
    id: 'T001',
    description: 'Тушка Индейки',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'birdmeat',
    type: 'turkey',
    isactive: false,
    price: 450,
    forms: [{
            isactive: true,
            id: 'big01',
            name: 'Большая',
            weightmax: 9,
            weightmin: 7
        },
        {
            isactive: true,
            id: 'med02',
            name: 'Средняя',
            weightmax: 7,
            weightmin: 5
        },
        {
            isactive: true,
            id: 'sma03',
            name: 'Маленькая',
            weightmax: 5,
            weightmin: 3
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://images.aif.ru/008/183/8f0224384272a0c44fa9ae9036d15ea8.jpg'
    },
    promt: 'Выберите размер индейки!'
}, function (err, proto) {

});

Protos.add({
    id: 'G001',
    description: 'Тушка Гуся',
    owner: {
        id: 'FARM01',
        name: 'Индеец Гусев'
    },
    category: 'birdmeat',
    type: 'goose',
    isactive: false,
    price: 650,
    forms: [{
            isactive: true,
            id: 'big01',
            name: 'Большая',
            weightmax: 7,
            weightmin: 6
        },
        {
            isactive: true,
            id: 'med02',
            name: 'Средняя',
            weightmax: 5,
            weightmin: 4
        },
        {
            isactive: true,
            id: 'sma03',
            name: 'Маленькая',
            weightmax: 3,
            weightmin: 2
        }
    ],
    expperiod: 14,
    picture: {
        contentType: 'image/jpeg',
        contentUrl: 'http://www.nexplorer.ru/load/Image/1213/gus_z_5.jpg'
    },
    promt: 'Выберите размер гуся!'
}, function (err, proto) {

});//CREATE PROTOS

/**
 * YaMoney auth GET middleware
 */
function getAccessToken(req, res, next) {
    if (!req.query.code) return next(new Error('code expected'));
    var code = req.query.code;
    var tokenComplete = function (err, data) {
        if (err) return next (new TokenError('Error: did not get the token: ' + {err}));

        console.info('tokenComplete data: ' + JSON.stringify(data));

        var sessionId   = req.query.sessionId;
        var accessToken = data.access_token;

        // If token has not been received
        if (accessToken === undefined) return next(new TokenError('Access token is undefined.'));
        else if (sessionId === undefined) return next(new Error('Session is not defined.'));

        // restore session
        Sessions.findById(sessionId, function(err, address) {

            if (err) return next(err);

            var userId = address.user.id;
            // Save user access token to DB
            Users.setUserToken(userId, accessToken, function(err) {
                if (err) return next(new Error('Try another time.'));
                console.info('Added token for ' + {userId});
            });

            // Send success status
            res.status(200);
            res.end();

            // let msg = new builder.Message()
            //  .address(address)
            //  .text("Great! U R Autorized...");
            // bot.send(msg);

            console.info('tokenComplete address: ' + JSON.stringify(address));
            bot.beginDialog({id:address.id, user:address.user, bot:address.bot, channelId:address.channelId, conversation:address.conversation, serviceUrl:address.serviceUrl},'/yabalance');
        });
    };
    yandexMoney.getAccessToken(config.yandexAPI.clientId, code, config.yandexAPI.redirectURI, config.yandexAPI.clientSecret, tokenComplete);
}

bot.beginDialogAction('beginOrderDialog', '/order');//переход в раздел заказа(корзины)
bot.beginDialogAction('beginInfoDialog', '/info');//переход в раздел информации и боте и услуге
bot.beginDialogAction('closeOnRefuse', '/refuse');
bot.beginDialogAction('beginPaymentDialog', '/clientdata/payment');

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var defgreet = "Меня зовут Индеец Гусев! =)! Как дела?";
                var d = new Date;
                var dh = d.getHours();
                const defimg = new builder.Message()
                    .address(message.address)
                    .attachments([{
                        contentType: 'image/jpeg',
                        contentUrl: 'http://птицасфермы.рф/wp-content/uploads/2016/11/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D0%98%D0%BD%D0%B4%D0%B5%D0%B5%D1%86-%D0%93%D1%83%D1%81%D0%B5%D0%B2_%D0%B8%D1%82%D0%BE%D0%B3.jpg'
                    }]);
                bot.send(defimg);
                if (22 >= dh && dh >= 16) {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Добрый Вечер! " + defgreet);
                    bot.send(reply);
                } else if (16 >= dh && dh >= 12) {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Добрый День! " + defgreet);
                    bot.send(reply);
                } else if (12 >= dh && dh >= 5) {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Доброе Утро! " + defgreet);
                    bot.send(reply);
                } else {
                    const reply = new builder.Message()
                        .address(message.address)
                        .text("Доброй Ночи! " + defgreet);
                    bot.send(reply);
                }
            }
        });
    }
});

bot.dialog('/', [
    function (session) {
        session.beginDialog('/clientdata/fio');
    },
    function (session) {
        session.beginDialog('/client/check');
    },
    function (session) {
        var date = new Date();
        if (date.getDay() == 4 && date.getHours() <= 23 || date.getDay() < 4 || date.getDay() > 5) {
            session.userData.deldate = 'ближайшую пятницу';
        } else {
            session.userData.deldate = 'следующую пятницу';
        }
        var msg = new builder.Message(session).addAttachment(createStartCard(session));
        session.send(msg);
    },
    function (session) {
        session.beginDialog('/clientdata');
    },
    function (session) {
        session.endDialog();
    }
]);//CORE
bot.dialog('/client/check', [
    function (session) {
        Users.findByUserId(session.message.address.user.id, function (err) {
            if (err) {
                session.beginDialog('/client/add');
            } else {
                Orders.findConfirmedAndPayed(session.message.address.user.id, function (err, order) {
                    if (err) {
                        console.log(err);
                        session.endDialogWithResult();
                    } else {
                        session.userData.currentorder = order.id;
                        session.send('Требуется подвердить заказ: ' + order.id);
                        session.beginDialog('/success/arrived');
                    }
                });
            }
        })
    }
]);//USER CHECK
bot.dialog('/client/add', [
    function (session) {
        builder.Prompts.number(session, "Придумайте ПИН-Код из 4 цифр.");
    },
    function (session, results) {
        session.userData.pin = results.response;
        Users.authUser(session.message.address.user.id, session.userData.pin, function(err) {
            if(err) {
                if(err.code === 'USER_NOT_FOUND') {
                    Users.add(session.message.address.user.id, session.userData.pin, function(err) {
                        if(err) {
                            session.send(err.message);
                        }
                        else {
                            Sessions.add(session.message.address, function(err) {
                                if(err) {
                                    session.send(err.message);
                                }
                                else {
                                    session.send("Отлично! Вы авторизованы! Запомните свой пароль. Он потребуется вам для подтверждения получения заказа");
                                    session.endDialogWithResult();
                                }
                            });
                        }
                    });
                }
            }
        });
    }
]);//ADDING USER


bot.dialog('/client/history', [
    function (session) {
        //session.send('ПРИВЕТ! Тут должен быть личный кабинет, пока все это дело в разработке.');
        Orders.findByClientId(session.message.address.user.id, function (err, order) {
            if (order.totalprice >= 5000) {
                session.userData.delcost = 0;
            }
            order.status = 'ON_CONFIRMATION';
            order.deliverycost = session.userData.delcost;
            order.totalamount = order.totalprice + session.userData.delcost;
            order.save(function (err, order) {
                if (err) {
                    console.error(err);
                }
                session.userData.currentorder = order.id;
                console.log('ORDER ON_CONFIRMATION. Status updated for: ' + order.id);
                createOrderCard(session, order, function (err, card) {
                    if (err) {
                        console.log(err);
                    } else {
                        var msg = new builder.Message(session).addAttachment(card);
                        session.send(msg);
                    }
                });
            });
        });
    }
]); //USER PROFILE
bot.dialog('/order', [
    function (session) {
        session.beginDialog('/order/type');
    },
    function (session) {
        session.beginDialog('/order/comment');
    },
    function (session) {
        session.endDialogWithResult();
    }
]);//ORDER
bot.dialog('/order/type', [
    function (session) {
        Protos.findAll(function (err, protos) {
            if (!err && protos) {
                var options = [];
                session.userData.protos = [];
                for (var i = 0; i < protos.length; i++) {
                    if (protos[i].isactive) {
                        options.push(protos[i].description);
                        session.userData.protos.push(protos[i]);
                    }
                }
                builder.Prompts.choice(session, 'Какую продукцию вы бы хотели заказать?', options);
            }
        });
    },
    function (session, results) {
        session.userData.ordertype = results.response;
        session.userData.prototype = session.userData.protos[results.response.index];
        session.beginDialog('/order/size');
    }
]);//TYPE
bot.dialog('/order/size', [
   function (session) {
       var result = {};
       var prodprice;
       if (session.userData.prototype) {
           if (session.userData.prototype.forms) {
               for (var i = 0; i < session.userData.prototype.forms.length; i++) {
                   prodprice = ' ' + (session.userData.prototype.forms[i].weightmax * session.userData.prototype.price);
                   if (session.userData.prototype.forms[i].isactive) {
                       result[session.userData.prototype.forms[i].name + ':' + prodprice + defcur] = session.userData.prototype.forms[i].id;
                   }
               }
           }
           const defimg = new builder.Message()
               .text(session.userData.prototype.description)
               .attachments([{
                   contentType: session.userData.prototype.picture.contentType,
                   contentUrl: session.userData.prototype.picture.contentUrl
               }]);
           session.send(defimg);
           result['ВЕРНУТЬСЯ К ВЫБОРУ!'] = 'back';
           builder.Prompts.choice(session, session.userData.prototype.promt, result);
       }
   },
   function (session, results, next) {
       session.userData.size = results.response.entity;
       if (session.userData.prototype.qtymax == 1 || session.userData.size == 'ВЕРНУТЬСЯ К ВЫБОРУ!') {
           session.userData.prodqty = 1;
           next();
       } else {
           session.beginDialog('/order/size/qty');
       }
   },
   function (session) {
       if (session.userData.size == 'ВЕРНУТЬСЯ К ВЫБОРУ!') {
           session.beginDialog('/order/type');
       } else {
           session.beginDialog('/order/add');
       }
   }
]);//SIZE
bot.dialog('/order/size/qty', [
    function (session) {
        builder.Prompts.number(session, 'Введите количество упаковок от 1 до ' + session.userData.prototype.qtymax);
    },
    function (session, results) {
        if (session.userData.prototype.qtymax >= results.response) {
            session.userData.prodqty = results.response;
            session.endDialogWithResult();
        } else {
            session.beginDialog('/order/size/qty');
        }
    }
]);//QTY
bot.dialog('/order/add', [
    function (session) {
        var prodprice;
        var wmax;
        var wmin;
        var selection = session.userData.size.split(':');
        for (var i = 0; i < session.userData.prototype.forms.length; i++) {
            if (session.userData.prototype.forms[i].name == selection[0]) {
                prodprice = (session.userData.prototype.forms[i].weightmax * session.userData.prototype.price);
                wmax = session.userData.prototype.forms[i].weightmax;
                wmin = session.userData.prototype.forms[i].weightmin;
            }
        }
        var date = new Date();
        Products.add({
            id: 'PD' + session.userData.prototype.id + date.getTime(),
            description: session.userData.prototype.description,
            owner: {
                id: session.userData.prototype.owner.id,
                name: session.userData.prototype.owner.name
            },
            orderid: orderid,
            storageid: storageid,
            clientid: session.message.address.user.id,
            category: session.userData.prototype.forms,
            type: session.userData.prototype.type,
            status: {
                date: date.toLocaleString(),
                status: 'NOORDER_NEW',
            },
            price: prodprice,
            subtotal: prodprice * session.userData.prodqty,
            qty: session.userData.prodqty,
            form: selection[0],
            size: {
                weightmax: wmax,
                weightmin: wmin
            },
            expperiod: session.userData.prototype.expperiod,
            picture: {
                contentType: session.userData.prototype.picture.contentType,
                contentUrl: session.userData.prototype.picture.contentUrl
            }
        }, function (err, product) {

        });
        builder.Prompts.choice(session, 'Хотите заказать другую продукцию?', ['Да', 'Нет']);
    },
    function (session, results) {
        if (results.response.entity == 'Да') {
            session.beginDialog('/order/type');
        } else {
            console.log(session.userData.prodqty + 'отказ от перехода на выбор группы продуктов');
            session.endDialogWithResult();
        }
    }
]);//ADD PRODUCT TO ORDER
bot.dialog('/order/comment', [
    function (session) {
        builder.Prompts.choice(session, 'Есть ли у вас вопросы или комментарии к заказу.', ['Да', 'Нет'])
    },
    function (session, results, next) {
        if (results.response.entity == 'Да') {
            next();
        } else {
            session.endDialog();
        }
    },
    function (session) {
        builder.Prompts.text(session, 'Напишите ваши пожелания по заказу.')
    },
    function (session, results) {
        session.userData.comment = results.response;
        session.endDialogWithResult();
    }
]);//ORDER COMMENT
bot.dialog('/clientdata', [
    function (session, results, next) {
        if (session.userData.phone == null || session.userData.changephone.entity == 'Исправить!') {
            session.beginDialog('/clientdata/phone');
        } else {
            next();
        }
    },
    // function (session) {
    //     session.beginDialog('/clientdata/phone');
    // },
    function (session) {
        session.beginDialog('/clientdata/email');
    },
    function (session) {
        session.beginDialog('/clientdata/delivery');
    },
    function (session) {
        session.beginDialog('/order/confirmation');
    },
    function (session) {
        session.beginDialog('/clientdata/payment');
    },
    function (session) {
        session.endDialogWithResult();
    }
]);//CLIENTDATA MAIN
bot.dialog('/clientdata/phone', [
    function (session) {
        builder.Prompts.text(session, "Введите ваш номер телефона без кода страны.");
    },
    function (session, results) {
        session.userData.phone = results.response;
        phonelem = session.userData.phone.split('');
        if (phonelem.length > 10) {
            session.send("Номер слишком длинный! Введите коректный номер.");
            session.beginDialog('/clientdata/phone');
        } else if (phonelem.length < 10) {
            session.send("Номер слишком короткий! Введите коректный номер.");
            session.beginDialog('/clientdata/phone');
        } else {
            session.userData.correctPhone = phonelem[0] + phonelem[1] + phonelem[2] + "-" + phonelem[3] + phonelem[4] + phonelem[5] + phonelem[6] + phonelem[7] + phonelem[8] + phonelem[9];
            builder.Prompts.choice(session, "Проверьте номер телефона клиента: " + "+7" + session.userData.correctPhone, ["Верно!", "Исправить!"]);
        }
    },
    function (session, results) {
        session.userData.changephone = results.response;
        if (session.userData.changephone.entity == 'Исправить!') {
            session.beginDialog('/clientdata');
        } else {
            session.endDialogWithResult(results);
        }
    }
]);//CLIENT PHONE NUMBER

bot.dialog('/clientdata/fio', [
    function (session) {
        if (session.userData.fullclientname == null) {
            builder.Prompts.text(session, 'Как к вам обращаться?')
        } else {
            session.endDialogWithResult();
        }
    },
    function (session, results) {
        session.userData.fullclientname = results.response;
        session.endDialogWithResult();
    }
]);//ORDER COMMENT

bot.dialog('/clientdata/email', [
    function (session) {
        if (session.userData.clientmail == null) {
            builder.Prompts.text(session, 'Напишите адрес вашей электронной почты.');
        } else {
            session.endDialogWithResult();
        }
    },
    // function (session) {
    //     builder.Prompts.text(session, 'Напишите адрес вашей электронной почты.')
    // },
    function (session, results) {
        session.userData.clientmail = results.response;
        session.endDialogWithResult();
    }
]);//ORDER COMMENT

bot.dialog('/clientdata/delivery', [
    function (session) {
        builder.Prompts.choice(session, 'Выберите способ доставки', ['Самовывоз', 'Доставка по адресу'])
    },
    function (session, results) {
    session.userData.delivery = results.response.entity;
        if (session.userData.delivery == 'Самовывоз') {
            session.beginDialog('/clientdata/delivery/shop');
        } else {
            session.beginDialog('/clientdata/delivery/custom');
        }
    },
    function (session) {
        session.endDialogWithResult();
    }
]);//LOCATION CHOICE

bot.dialog('/clientdata/delivery/error', [
    function (session) {
        builder.Prompts.choice(session, 'Адрес, который вы ввели, находится вне зоны доставки. Или я не правильно распознал его! Попробуйте так же указать город, для более точного определения адреса!', ['Самовывоз', 'Доставка по адресу'])
    },
    function (session, results) {
        session.userData.delivery = results.response.entity;
        if (session.userData.delivery == 'Самовывоз') {
            session.beginDialog('/clientdata/delivery/shop');
        } else {
            session.beginDialog('/clientdata/delivery/custom');
        }
    }
]);//LOCATION CHOICE

bot.dialog('/clientdata/delivery/custom', [
    function (session) {
        builder.Prompts.text(session, 'Введите адрес доставки в свободной форме!')
    },
    function (session, results) {
        session.userData.location = results.response;
        googleMapsClient.geocode({
            address: session.userData.location,
            language: "ru"
        }, function(err, response) {
            if (err || response.json.results[0] == null) {
                session.send('По вашему запросу ничего не найдено.');
                session.beginDialog('/clientdata/delivery/custom');
            } else if (response.json.results[0].formatted_address.split(',').length <= 3) {
                session.send('Пожалуйста, укажите более точный адрес доставки.');
                session.beginDialog('/clientdata/delivery/custom');
            } else {
                console.log(response.json.results);
                session.userData.delcost = 'error';
                for (var i = 0; i < response.json.results[0].address_components.length; i++) {
                    if (response.json.results[0].address_components[i].long_name == '125466') {
                        session.userData.delcost = 0;
                    } else if (response.json.results[0].address_components[i].long_name == 'Москва') {
                        session.userData.delcost = 500;
                    } else if (response.json.results[0].address_components[i].long_name == 'Одинцово') {
                        session.userData.delcost = 330;
                    } else if (response.json.results[0].address_components[i].long_name == 'Химки') {
                        session.userData.delcost = 330;
                    }
                }
                console.log(session.userData.delcost);
                var latlng = response.json.results[0].geometry.location.lat + ',' + response.json.results[0].geometry.location.lng;
                const defimg = new builder.Message()
                    .text(response.json.results[0].formatted_address)
                    .attachments([{
                        contentType: 'image/jpeg',
                        contentUrl: 'https://maps.googleapis.com/maps/api/staticmap?center=' + latlng + '&size=600x450&maptype=roadmap&zoom=16&' + '&markers=color:red%7Clabel:C%7C' + latlng +  '&key=AIzaSyA8qM5dkO51c4StRFPhVcQ6RpvDIHcbK5A'
                    }]);
                session.send(defimg);
                session.userData.formattedloc = response.json.results[0].formatted_address;
                if (session.userData.delcost == 'error') {
                    session.beginDialog('/clientdata/delivery/error');
                } else {
                    builder.Prompts.choice(session, 'Подтвердите адрес. Стоимость доставки по этому адресу составляет ' + session.userData.delcost + defcur, ['Верно!', 'Исправить!']);
                }
            }
        });
    },
    function (session, results) {
        console.log(results.response);
        if (results.response.entity == 'Исправить!') {
            session.beginDialog('/clientdata/delivery/custom');
        } else {
            session.userData.delivery = 'Доставка по адресу';
            session.endDialogWithResult(results);
        }
    }
]);//CUSTOM LOCATION DELIVERY

bot.dialog('/clientdata/delivery/shop', [
    function (session) {
        Locations.findAll(function (err, locations) {
            if (!err && locations) {
                var options = [];
                for (var i = 0; i < locations.length; i++) {
                    options.push(locations[i].address);
                }
                options.push('Хочу доставку на дом');//НАДО СДЕЛАТЬ ВОЗВРАТ!!!
                builder.Prompts.choice(session, 'Выберите адрес самовывоза', options);
            }
        });
    },
    function (session, results) {
        if (results.response.entity == 'Хочу доставку на дом') {
            session.beginDialog('/clientdata/delivery/custom');
        } else {
            session.userData.formattedloc = results.response.entity;
            session.userData.delcost = 0;
            session.userData.delivery = 'Самовывоз';
            session.endDialogWithResult(results);
        }
    }
    // function (session) {
    //     builder.Prompts.text(session, 'Введите свой домашний адрес, и я подберу ближайшие к вам пункты самовывоза!')
    // },
    // function (session, results) {
    //     // function BubbleSort(A) {
    //     //     var n = A.length;
    //     //     for (var i = 0; i < n-1; i++) {
    //     //         for (var j = 0; j < n-1-i; j++) {
    //     //             if (A[j+1] < A[j]) {
    //     //                 var t = A[j+1]; A[j+1] = A[j]; A[j] = t; }
    //     //         }
    //     //     }
    //     //     return A;
    //     // }
    //     // function distance(lat1, lon1, lat2, lon2) {
    //     //     var p = 0.017453292519943295;    // Math.PI / 180
    //     //     var c = Math.cos;
    //     //     var a = 0.5 - c((lat2 - lat1) * p)/2 +
    //     //         c(lat1 * p) * c(lat2 * p) *
    //     //         (1 - c((lon2 - lon1) * p))/2;
    //     //     return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    //     // }
    //     session.userData.location = results.response;
    //     googleMapsClient.geocode({
    //         address: session.userData.location,
    //         language: "ru"
    //     }, function(err, response) {
    //         if (err || response.json.results[0] == null) {
    //             session.send('По вашему запросу ничего не найдено.');
    //             session.beginDialog('/clientdata/delivery/shop');
    //         } else {
    //             Locations.findAll(function (err, locations) {
    //                 if (!err && locations) {
    //                     var options = [];
    //                     for (var i = 0; i < locations.length; i++) {
    //                         options.push(locations[i].address);
    //                     }
    //                     builder.Prompts.choice(session, 'Выберите адрес самовывоза', options);
    //
    //
    //
    //                     // session.userData.shops = [];
    //                     // for (var i = 0; i < locations.length; i++) {
    //                     //     //dist.push(distance(locations[i].geometry.lat, locations[i].geometry.lng, response.json.results[0].geometry.location.lat, response.json.results[0].geometry.location.lng));
    //                     //     session.userData.shops[locations[i].address] = BubbleSort(distance(locations[i].geometry.lat, locations[i].geometry.lng, response.json.results[0].geometry.location.lat, response.json.results[0].geometry.location.lng));
    //                     //     //BubbleSort(session.userData.shops);
    //                     // }
    //                     // //console.log(dist);
    //                     // console.log(session.userData.shops);
    //                 }
    //             });
    //
    //
    //
    //
    //
    //
    //             //console.log(response.json.results);
    //             var latlng = response.json.results[0].geometry.location.lat + ',' + response.json.results[0].geometry.location.lng;
    //             const defimg = new builder.Message()
    //                 .text('Ближайший к вам пункт самовывоза:')
    //                 .attachments([{
    //                     contentType: 'image/jpeg',
    //                     contentUrl: 'https://maps.googleapis.com/maps/api/staticmap?size=650x480&scale=2&maptype=roadmap&' + '&markers=color:red%7Clabel:C%7C' + latlng + '&markers=color:blue%7Clabel:C%7C' + '55.7514082,37.5977499' + '&key=AIzaSyA8qM5dkO51c4StRFPhVcQ6RpvDIHcbK5A'
    //                 }]);
    //             session.send(defimg);
    //             session.userData.formattedloc = 'Москва Арбат 10';//response.json.results[0].formatted_address;
    //             builder.Prompts.choice(session, 'Вам удобно подъехать к этому пункту?', ['Да!', 'Выбрать другой!', 'Хочу доставку на дом!']);
    //         }
    //     });
    // },
    // function (session, results) {
    //     if (results.response.entity == 'Выбрать другой!') {
    //         session.beginDialog('/clientdata/delivery/shop');
    //     } else if (results.response.entity == 'Хочу доставку на дом!') {
    //         session.beginDialog('/clientdata/delivery/custom');
    //     } else {
    //         session.userData.delivery = 'Самовывоз';
    //         session.endDialogWithResult(results);
    //     }
    // }
]);//SHOP LOCATIONS

bot.dialog('/order/confirmation', [
    function (session) {
        var sum = 0;
        var date = new Date();
        function arraySum(array){
            for(var i = 0; i < array.length; i++){
                sum += array[i];
            }
        }
        Products.findAll(function (err, products) {
            if (!err && products) {
                session.userData.products = [];
                session.userData.prices = [];
                for (var i = 0; i < products.length; i++) {
                    if (products[i].clientid == session.message.address.user.id && products[i].status.status == 'NOORDER_NEW') {
                        session.userData.products.push(products[i].id);
                        session.userData.prices.push(products[i].subtotal);
                        products[i].status = {
                            date: date.toLocaleString(),
                            status: 'INORDER_NEW'
                        };
                        products[i].save(function (err, product) {
                            if (err) {
                                console.error(err);
                            }
                            console.log('PD status updated for: ' + product.id);
                        });
                    }
                }
                arraySum(session.userData.prices);
                Orders.add({
                    id: 'ORD' + date.getTime(),
                    clientinfo: {
                        id: session.message.address.user.id,
                        phone: session.userData.correctPhone,
                        email: session.userData.clientmail, //НАДО СДЕЛАТЬ ПОЧТУ
                        fio: session.userData.fullclientname
                    },
                    status: 'UNCONFIRMED_NEW',
                    date: date.toLocaleString(),
                    totalprice: sum,
                    totalamount: sum + session.userData.delcost, // Доставка + стоимости + налоги
                    paymentmethod: 'N/A',
                    isactive: true,
                    isdeleted: '',
                    delivery: session.userData.delivery,
                    deliverycost: session.userData.delcost,
                    tax: 0,
                    location: session.userData.formattedloc,
                    products: session.userData.products,
                    comment: session.userData.comment
                }, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        session.beginDialog('/client/history');
                    }
                });
            }
        });
    }
]);

bot.dialog('/clientdata/payment', [
    function (session) {
        if (session.userData.delivery == 'Самовывоз') {
            builder.Prompts.choice(session, 'Выберите способ оплаты!', ['Оплата наличными', 'Отказаться'])
        } else {
            builder.Prompts.choice(session, 'Выберите способ оплаты!', ['Оплата курьеру', 'Отказаться'])
        }
    },
    function (session, results) {
        session.userData.paymenttype = results.response.entity;
        Orders.findById(session.userData.currentorder, function (err, order) {
            if (order.status == 'ON_CONFIRMATION') {
                order.paymentmethod = session.userData.paymenttype;
                order.save(function (err, order) {
                    if (err) {
                        console.error(err);
                    }
                    console.log('ORDER UPDATED. Payment method add for: ' + order.id);
                });
            } else {
                session.send('Нет активных заказов');
            }
        });
        if (results.response.entity == 'Отказаться') {
            session.beginDialog('/refuse');
        } else {
            builder.Prompts.choice(session, 'Отправить заказ?', ['ДА!', 'Отказаться']);
        }
    },
    function (session, results) {
        if (results.response.entity == 'Отказаться') {
            session.beginDialog('/refuse');
        } else {
            session.beginDialog('/success');
        }
    }
]);//ORDER COMMENT

bot.dialog('/success', [
    function (session) {
        Orders.findById(session.userData.currentorder, function (err, order) {
            order.status = 'CONFIRMED_PAYED';
            order.save(function (err, order) {
                if (err) {
                    console.error(err);
                }
                console.log('ORDER CONFIRMED. Status updated for: ' + order.id);
                createOrderPreview(session, order, function (err, card) {
                    if (err) {
                        console.log(err);
                    } else {
                        var msg = new builder.Message(session).addAttachment(card);
                        session.send(msg);
                    }
                });
                creteOrderMail(session, order, function (err, html) {
                    if (err) {
                        console.log(err);
                    } else {
                        session.beginDialog('/success/arrived');
                    }
                });
            });
        })
    }
]);//ORDER COMMENT

bot.dialog('/success/arrived', [
    function (session, results, next) {
        var date = new Date();
        console.log(date.toLocaleString()); //показывает дату и время в числовом варианте
        console.log(date.toDateString()); //показывает дату и месяц с днем недели на ангилийском
        console.log(date.getDay()); //показывает текущий день недели от 1 до 7
        next();
    },
    function (session) {
        session.send('Мы привезем ваш заказ в ' + session.userData.deldate + '!');
        builder.Prompts.choice(session, 'Подтвердите получение заказа', ['ПОЛУЧИЛ!!! =)'])
    },
    function (session, results) {
        session.userData.orderarrived = results.response.entity;
        if (results.response.entity == 'ПОЛУЧИЛ!!! =)') {
            builder.Prompts.number(session, 'Введите свой пароль для подтверждения получения заказа.');
        }
    },
    function (session, results) {
        session.userData.pin = results.response;
        Users.authUser(session.message.address.user.id, session.userData.pin, function(err) {
            if(err) {
                if(err.code === 'INCORRECT_PASSWORD') {
                    session.send('Неверный пин-код.');
                    session.beginDialog('/success/arrived');
                }
            } else {
                Orders.findById(session.userData.currentorder, function (err, order) {
                    if (order.status == 'CONFIRMED_PAYED') {
                        order.status = 'CLOSED';
                        order.isactive = false;
                        order.save(function (err, order) {
                            if (err) {
                                console.error(err);
                            }
                            console.log('ORDER CLOSED. Status updated for: ' + order.id);
                            session.send('Огромное спасибо за подтверждение! Ваш заказ №: ' + order.id + ' закрыт. Наслаждайтесь нашей продукцией)');
                            //builder.Prompts.choice(session, 'Что бы вы хотели сделать? =)', ['Заказать еще!', 'Посмотреть историю заказов']);
                            session.beginDialog('/');
                        });
                    } else {
                        session.send('Нет активных заказов');
                    }
                });
                //builder.Prompts.choice(session, 'Что бы вы хотели сделать? =)', ['Заказать еще!', 'Посмотреть историю заказов']);
            }
        });
    }
    // function (session, results) {
    //     if (results.response.index == 0) {
    //         session.beginDialog('/');
    //     } else {
    //         session.userData.utility = 1;
    //         session.beginDialog('/client/history');
    //     }
    // }
]);//ORDER COMMENT

bot.dialog('/info', [
    function (session) {
        var msg = new builder.Message(session).addAttachment(createInfoCard(session));
        session.send(msg);
    }
]);//INFO
bot.dialog('/refuse', [
    function (session) {
        session.send('До свидания');
        Orders.findById(session.userData.currentorder, function (err, order) {
            if (order.status == 'ON_CONFIRMATION') {
                order.status = 'DELETED_BY_USER';
                order.isdeleted = true;
                order.save(function (err, order) {
                    if (err) {
                        console.error(err);
                    }
                    console.log('ORDER DELETED. Status updated for: ' + order.id);
                });
            } else {
                session.send('Нет активных заказов');
            }
        });
        session.beginDialog('/');
    }
]);//REFUSE

// bot.dialog('/clientdata/payment', [
//     function (session) {
//         builder.Prompts.number(session, "Придумайте ПИН-Код из 4 цифр.");
//     },
//     function (session, results) {
//         session.userData.pin = results.response;
//
//         // check if user already in database
//         Users.authUser(session.message.address.user.id, session.userData.pin, function(err, user) {
//             if(err) {
//                 if(err.code === 'USER_NOT_FOUND') {
//                     // not found add new one
//                     Users.add(session.message.address.user.id, session.userData.pin, function(err, user) {
//                         if(err) {
//                             session.send(err.message);
//                         }
//                         else {
//                             session.send("New user added, need to link Yandex wallet");
//                             // need to link Yandex wallet to the account
//                             Sessions.add(session.message.address, function(err, sessionAddress) {
//                                 if(err) {
//                                     session.send(err.message);
//                                 }
//                                 else {
//                                     var url = yandexMoney.buildTokenUrl(sessionAddress.id);
//                                     session.send(url);
//                                 }
//                             });
//                         }
//                     });
//                 }
//                 else {
//                     if(err.code === 'USER_NOT_AUTHENTICATED') {
//                         session.send("Old user, need to re-link Yandex wallet");
//                         // need to link Yandex wallet to the account
//                         Sessions.add(session.message.address, function(err, sessionAddress) {
//                             if(err) {
//                                 session.send(err.message);
//                             }
//                             else {
//                                 var url = yandexMoney.buildTokenUrl(sessionAddress.id);
//                                 session.send(url);
//                             }
//                         });
//                     }
//                     else {
//                         session.send(err.message);
//                     }
//                 }
//             }
//             else {
//                 session.send("Autorized");
//                 session.beginDialog('/yabalance');
//             }
//         });
//     }
// ]);//PAYMENT MAIN
// bot.dialog('/yabalance',[
//     function (session) {
//         builder.Prompts.choice(session, "Проверить баланс кошелька?", ['ДА', 'НЕТ']);
//     },
//     function (session, results) {
//         if (results.response.entity == 'ДА') {
//                 yandexMoney.getAccountInfo(session.message.user.id, function(msg, action) {
//                     session.send(msg);
//                     session.beginDialog('/yap2p');
//                 });
//         } else {
//             session.beginDialog('/yap2p');
//         }
//     }
// ]);//BALANCE CHECK
// bot.dialog('/yap2p',[
//     function (session) {
//         builder.Prompts.choice(session, "Make a Transfer?", ["yes","no"]);
//     },
//     function (session, results) {
//         if (results.response.entity == 'yes') {
//             builder.Prompts.number(session, 'Введите номер кошелька')
//         } else {
//             session.send("starting over...");
//             session.beginDialog('/yabalance');
//         }
//     },
//     function (session, results) {
//         if (results.response) {
//             var account = results.response.entity;
//             var amount = 10;
//             var msg = "Transfer from ReGaBot user " + session.message.user.id;
//             yandexMoney.p2pPayment(session.message.user.id, account, amount, msg, function(msg, action) {
//                 session.send(msg);
//             });
//         } else {
//             session.send("Ops, there is no account number, starting over");
//             session.beginDialog('/');
//         }
//     }
// ]);//P2P TRANSFER

function createStartCard(session) {
    return new builder.HeroCard(session)
        .title(session.userData.fullclientname + ', у вас есть уникальная возможность заказать свежайшие продукты напрямую от фермера! Закажите товар сейчас и мы доставим его в ' + session.userData.deldate + '!')
        .images(getStartCardImages(session))
        .buttons(getStartDialogActions(session));
}
function createInfoCard(session) {
    return new builder.HeroCard(session)
        .title('Отслеживание товара на базе Blockchain и смарт-контрактов Ethereum!')
        .images(getInfoCardImages(session))
        .buttons(getInfoDialogActions(session));
}

function createOrderPreview(session, order, cb) {
    var date = new Date();
    Products.findAllByIds(order.products, function (err, products) {
        if (err) {
            console.log(err);
            cb(err, null);
            return;
        }
        var items = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].clientid == session.message.address.user.id && products[i].status.status == 'ORDERED' && products[i].orderid == order.id) {
                items.push(
                    builder.ReceiptItem.create(session, products[i].qty + ' X ' + products[i].price + defcur, products[i].description + ': ' + products[i].form)
                        .quantity(products[i].qty)
                        .image(builder.CardImage.create(session, products[i].picture.contentUrl))
                )
            }
        }
        items.push(
            builder.ReceiptItem.create(session, order.deliverycost + defcur, 'Доставка')
                .quantity(1)
                .image(builder.CardImage.create(session, 'http://e-matras.ua/media/wysiwyg/icons-delivery/Icon-dostavka-09.png'))
        );
        var card =  new builder.ReceiptCard(session)
            .title(session.userData.fullclientname + ', cпасибо за заказ! Вы можете посмотреть его на вашей электронной почте.')
            .facts([
                builder.Fact.create(session, order.id, 'Номер Заказа:'),
                builder.Fact.create(session, session.userData.formattedloc, 'Адрес:')
            ])
            .items(items)
            .total(order.totalprice + defcur);
        cb(null, card);
    });
}

function createOrderCard(session, order, cb) {
    var date = new Date();
    Products.findAllByIds(order.products, function (err, products) {
        if (err) {
            console.log(err);
            cb(err, null);
            return;
        }
        var items = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].status.status == 'INORDER_NEW') {
                products[i].status = {
                    date: date.toLocaleString(),
                    status: 'ORDERED'
                };
                products[i].orderid = order.id;
                products[i].save(function (err, product) {
                    if (err) {
                        console.error(err);
                    }
                    console.log('ORDER ID added for: ' + product.id);
                });
            }
            if (products[i].clientid == session.message.address.user.id && products[i].status.status == 'ORDERED' && products[i].orderid == order.id) {
                items.push(
                    builder.ReceiptItem.create(session, products[i].qty + ' X ' + products[i].price + defcur, products[i].description + ': ' + products[i].form)
                        .quantity(products[i].qty)
                        .image(builder.CardImage.create(session, products[i].picture.contentUrl))
                )
            }
        }
        items.push(
            builder.ReceiptItem.create(session, order.deliverycost + defcur, 'Доставка')
                .quantity(1)
                .image(builder.CardImage.create(session, 'http://e-matras.ua/media/wysiwyg/icons-delivery/Icon-dostavka-09.png'))
        );
        var card =  new builder.ReceiptCard(session)
            .title(order.clientinfo.id)
            .facts([
                builder.Fact.create(session, order.id, 'Номер Заказа:'),
                builder.Fact.create(session, order.location, 'Адрес доставки:'),
            ])
            .items(items)
            .total(order.totalamount + defcur)
            .buttons([
                builder.CardAction.dialogAction(session, 'beginPaymentDialog', null, 'Выбрать способ оплаты.'),
                builder.CardAction.dialogAction(session, 'closeOnRefuse', null, 'Отказаться!')
            ]);
        cb(null, card);
    });
}
function creteOrderMail(session, order, cb) {
    Products.findAllByOrderId(order.id, function (err, products) {
        if (err) {
            console.log(err);
            cb(err, null);
            return;
        }
        // Compile a function
        var fn = jade.compileFile('./orderemail.jade');

        // Render the function
        var html = fn({order:order , products:products});

        // Sending mail
        mailOptions['subject'] = 'От Индейца Гусева! Ваш заказ: ' + order.id;
        mailOptions['html'] = html;
        mailOptions['to'] = session.userData.fullclientname;
        mailOptions['bcc'] = session.userData.clientmail;

        //send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info) {
            if(error) {
                cb(error, null);
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
            cb(null, html);
        });
    });
}
function getStartCardImages(session) {
    return [
        builder.CardImage.create(session, 'http://fermana.ru/wa-apps/shop/themes/fermana/cat_img/molochnaya-produktsiya.jpg')];
}
function getInfoCardImages(session) {
    return [
        builder.CardImage.create(session, 'https://www.atraura.com/wp-content/uploads/2016/08/Ethereum.jpg')
    ];
}
function getStartDialogActions(session) {
    return [
        builder.CardAction.dialogAction(session, 'beginOrderDialog', null, 'Заказать!'),
        builder.CardAction.dialogAction(session, 'beginInfoDialog', null, 'Подробнее!')
    ];
}
function getInfoDialogActions(session) {
    return [
        builder.CardAction.dialogAction(session, 'beginOrderDialog', null, 'Заказать!'),
        builder.CardAction.dialogAction(session, 'closeOnRefuse', null, 'Отказаться!')
    ];
}
//ORDER ACTIONS
if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.use(restify.queryParser({ mapParams: false }));

    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.get('/api/yandex', getAccessToken);
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}