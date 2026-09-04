-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-08-2026 a las 01:57:55
-- Versión del servidor: 10.4.27-MariaDB
-- Versión de PHP: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `jak_movil`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculos`
--

CREATE TABLE `vehiculos` (
  `id` int(11) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(50) NOT NULL,
  `año` int(11) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `moneda` varchar(10) DEFAULT 'USD',
  `tipo` varchar(30) NOT NULL,
  `transmision` varchar(30) NOT NULL,
  `combustible` varchar(30) NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `condicion` varchar(50) DEFAULT NULL,
  `color_exterior` varchar(50) DEFAULT NULL,
  `color_interior` varchar(50) DEFAULT NULL,
  `kilometraje` varchar(50) DEFAULT NULL,
  `cilindraje` varchar(50) DEFAULT NULL,
  `traccion` varchar(20) DEFAULT NULL,
  `sector` varchar(150) DEFAULT NULL,
  `vendedor` varchar(150) DEFAULT NULL,
  `accesorios` text DEFAULT NULL,
  `equipamiento` text DEFAULT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `vehiculos`
--

INSERT INTO `vehiculos` (`id`, `marca`, `modelo`, `año`, `precio`, `moneda`, `tipo`, `transmision`, `combustible`, `imagen`, `condicion`, `color_exterior`, `color_interior`, `kilometraje`, `cilindraje`, `traccion`, `sector`, `vendedor`, `accesorios`, `equipamiento`, `descripcion`) VALUES
(1, 'Toyota', 'Corolla', 2020, '20500.00', 'USD', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Toyota+Corolla', 'Usado', 'Negro', NULL, NULL, NULL, NULL, NULL, NULL, 'Bolsa de aire (chofer)\nBolsa de aire (laterales)\nBolsa de aire (pasajero)\nBolsa de aire (traseras)\nAire acondicionado\nAsientos en tela\nBluetooth\nCámara de reversa\nPintura de fábrica\nRadio AM/FM\nVidrios eléctricos\nLuces de encendido diurno', NULL, NULL),
(2, 'Toyota', 'Corolla', 2016, '755000.00', 'DOP', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Toyota+RAV4', 'Usado', 'Gris', NULL, NULL, NULL, NULL, NULL, NULL, 'Alarma\nBolsa de aire (chofer)\nBolsa de aire (laterales)\nBolsa de aire (pasajero)\nBolsa de aire (traseras)\nFrenos ABS\nAire acondicionado\nBluetooth\nCámara de reversa\nGuía multifunción\nLlave inteligente\nPintura de fábrica\nPuerta eléctrica\nRadio multimedia\nRetrovisores eléctricos\nVidrios eléctricos\nTracción delantera', NULL, NULL),
(3, 'Honda', 'Civic', 2020, '1119000.00', 'DOP', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Honda+Civic', 'Usado', 'Azul', NULL, NULL, NULL, NULL, NULL, NULL, 'Alarma\nBolsa de aire (chofer)\nBolsa de aire (laterales)\nBolsa de aire (pasajero)\nBolsa de aire (traseras)\nFrenos ABS\nSeguros eléctricos\nSensores de parqueo\nAire acondicionado digital\nBluetooth\nCalefacción\nCámara de reversa\nCruise control\nRadio AM/FM\nRadio multimedia\nRetrovisores eléctricos\nVidrios eléctricos\nFaros halógenos/xenón\nLuces de encendido diurno', NULL, NULL),
(4, 'Honda', 'Fit', 2018, '650000.00', 'DOP', 'Hatchback', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Honda+CR-V', 'Usado', 'Blanco', NULL, NULL, NULL, NULL, NULL, NULL, 'Alarma\nBolsa de aire (chofer)\nBolsa de aire (laterales)\nBolsa de aire (pasajero)\nBolsa de aire (traseras)\nSeguros eléctricos\nAire acondicionado\nAsientos en tela\nCámara de reversa\nGuía hidráulico\nLimpia vidrios traseros\nLlave inteligente\nRadio multimedia\nVersión japonesa', NULL, NULL),
(5, 'Honda', 'Accord', 2020, '20500.00', 'USD', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Hyundai+Tucson', 'Usado', 'Rojo', NULL, NULL, NULL, NULL, NULL, NULL, 'Alarma\nBolsa de aire (chofer)\nBolsa de aire (laterales)\nFrenos ABS\nAire acondicionado\nAndroid Auto\nApple CarPlay\nAsientos en pana\nBluetooth\nCalefacción\nCámara de reversa\nGuía multifunción\nPintura de fábrica\nRadio AM/FM\nRadio multimedia\nRetrovisores eléctricos\nVidrios eléctricos', NULL, NULL),
(6, 'Honda', 'Fit', 2020, '820000.00', 'DOP', 'Hatchback', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Hyundai+Elantra', 'Usado', 'Gris', NULL, NULL, NULL, NULL, NULL, NULL, 'Bolsa de aire (chofer)\nBolsa de aire (pasajero)\nFrenos ABS\nSeguros eléctricos\nAire acondicionado\nAsientos en tela\nBluetooth\nCalefacción\nCámara de reversa\nGuía semi hidráulico\nLimpia vidrios traseros\nLlave inteligente\nPintura de fábrica\nPuerta eléctrica\nRadio AM/FM\nRadio multimedia\nRetrovisores eléctricos\nVidrios eléctricos\nVersión japonesa', NULL, NULL),
(7, 'Honda', 'CR-V', 2018, '23000.00', 'USD', 'Jeepeta', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Kia+Sportage', 'Usado', 'Gris', NULL, NULL, NULL, NULL, NULL, NULL, 'Alarma\nBolsa de aire (chofer)\nBolsa de aire (laterales)\nBolsa de aire (pasajero)\nBolsa de aire (traseras)\nFrenos ABS\nSeguros eléctricos\nAire acondicionado doble\nAire acondicionado normal\nAsientos eléctricos\nAsientos en piel\nBaúl eléctrico\nBluetooth\nCámara de reversa\nCruise control\nLimpia vidrios traseros\nLlave inteligente\nRadio AM/FM\nRetrovisores eléctricos\nSunroof\nVidrios eléctricos\nAros de fábrica', NULL, NULL),
(8, 'Honda', 'CR-V', 2018, '1195000.00', 'DOP', 'Jeepeta', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Kia+Picanto', 'Usado', 'Blanco', NULL, NULL, NULL, NULL, NULL, NULL, 'Bolsa de aire (chofer)\nBolsa de aire (laterales)\nBolsa de aire (pasajero)\nBolsa de aire (traseras)\nAire acondicionado digital\nAire acondicionado normal\nAndroid Auto\nApple CarPlay\nBluetooth\nRadio AM/FM\nTurbo', NULL, NULL),
(9, 'Toyota', 'Land Cruiser Prado', 2027, '99900.00', 'USD', 'Jeepeta', 'Automática', 'Diésel', 'https://via.placeholder.com/400x250?text=Nissan+Frontier', 'Nuevo', 'Blanco', 'Negro', NULL, NULL, '4WD', NULL, NULL, 'Aire acondicionado\nAlarma\nAirbags\nAirbag de pasajero\nAirbags laterales\nAirbags traseros\nFrenos ABS\nCruise control\nNavegación\nCámara de reversa\nSensor de parqueo\nBluetooth\nApple CarPlay\nAndroid Auto\nAsientos de cuero\nAsientos eléctricos\nVentanas automáticas\nSeguros eléctricos\nRetrovisores eléctricos\nTurbo diésel\nPintura de fábrica\nAros de fábrica', NULL, NULL),
(10, 'Mercedes-Benz', 'C300', 2017, '995000.00', 'DOP', 'Carro', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Nissan+Sentra', 'Usado', 'Gris', NULL, NULL, NULL, NULL, NULL, NULL, 'Techo panorámico\nAsientos en piel\n4MATIC\nAire acondicionado\nRadio CD-Player\nMotor de 4 cilindros\nAsientos eléctricos', NULL, NULL),
(11, 'Toyota', 'Hilux', 2023, '3465619.00', 'DOP', 'Camioneta', 'Automática', 'Diésel', 'https://via.placeholder.com/400x250?text=Ford+Explorer', 'Usado - Como nuevo', 'Negro', 'Negro', '32,000 km', '4', '4WD', NULL, NULL, 'Aire acondicionado\nAlarma\nAirbags\nAsientos de cuero\nVentanas automáticas\nFaros LED/Xenón\nÚnico dueño\nPintura de fábrica\nAros de fábrica', NULL, NULL),
(12, 'Dongfeng', 'AX7', 2024, '24000.00', 'USD', 'Jeepeta', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Chevrolet+Tahoe', 'Usado', 'Negro', 'Negro', '33,000 km', '4', '4WD', NULL, NULL, 'Aire acondicionado\nAlarma\nAirbags\nAirbag de pasajero\nAirbags laterales\nAirbags traseros\nFrenos ABS\nCruise control\nNavegación\nCámara de reversa\nSensor de parqueo\nBluetooth\nAndroid Auto\nAsientos de cuero\nAsientos eléctricos\nVentanas automáticas\nSeguros eléctricos\nGuía hidráulico\nGuía multifunción\nLlave inteligente\nFull Power\nFaros LED\nÚnico dueño\nPintura de fábrica\nAros de fábrica', 'Motor 1.6 Turbo\nPantalla táctil de 12 pulgadas\nApple CarPlay\nAndroid Auto\nCámara 360°\nAsientos en piel\nTecho panorámico\nRines deportivos de 18 pulgadas', NULL),
(13, 'Chevrolet', 'Silverado', 2022, '68500.00', 'USD', 'Camioneta', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Jeep+Wrangler', 'Usado', 'Negro', 'Gris', '0 km', '4', '4WD', 'Buenos Aires del Mirador', NULL, 'Aire acondicionado\nAlarma\nAirbags\nAirbag de pasajero\nAirbags laterales\nAirbags traseros\nFrenos ABS\nCruise control\nNavegación\nCámara de reversa\nSensor de parqueo\nBluetooth\nApple CarPlay\nAndroid Auto\nAsientos de cuero\nAsientos eléctricos\nVentanas automáticas\nSeguros eléctricos\nRetrovisores eléctricos\nGuía hidráulico\nGuía multifunción\nLlave inteligente\nFull Power\nFaros LED\nÚnico dueño\nPintura de fábrica\nAros de fábrica', NULL, NULL),
(14, 'Porsche', 'Macan T', 2025, '94000.00', 'USD', 'Jeepeta', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=BMW+X5', 'Usado', 'Blanco', 'Rojo', '15,000 km', '4', '4WD', 'San Martín de Porres', NULL, 'Aire acondicionado\nAlarma\nAirbags\nAirbag de pasajero\nAirbags laterales\nAirbags traseros\nFrenos ABS\nCruise control\nNavegación\nCámara de reversa\nSensor de parqueo\nBluetooth\nApple CarPlay\nAndroid Auto\nAsientos de cuero\nAsientos eléctricos\nVentanas automáticas\nSeguros eléctricos\nRetrovisores eléctricos\nGuía hidráulico\nGuía multifunción\nLlave inteligente\nFull Power\nFaros LED\nBaúl eléctrico\nÚnico dueño\nPintura de fábrica\nAros de fábrica', 'Motor 2.0L Turbo, 265 HP\nTransmisión PDK de 7 velocidades\nTracción AWD\nSport Chrono Package\nSport Exhaust en negro\nAros originales Porsche de 20 pulgadas\nPDLS Plus\nTecho panorámico\nInterior Leather Black / Red Stitching\nAsientos eléctricos de 14 posiciones y ventilados\nSistema de sonido BOSE\nCámara 360° y cámara trasera\nSensores delanteros y traseros\nLane Keeping System\nCruise Control\nBaúl eléctrico\nHomeLink\nLogo Porsche proyectado\nAcabados Piano Black / Black Gloss', 'Precio original: US$ 95,000. Precio de oportunidad: US$ 94,000. Configuración Macan T deportiva y elegante.'),
(15, 'MINI', 'Cooper Countryman', 2015, '565000.00', 'DOP', 'Carro', 'No especificada', 'Gasolina', 'https://via.placeholder.com/400x250?text=Mercedes+C-Class', 'Usado', NULL, NULL, '1 km', '4 cilindros', NULL, 'Ensanche Quisqueya', 'Reynoso Motors', 'Aire acondicionado\nTecho panorámico\nAsientos de piel\nAsientos eléctricos\nRadio CD-Player\n4MATIC\nClean CARFAX\nFinanciamiento disponible', 'Motor de 4 cilindros\nTecho panorámico\nInterior en piel\nAsientos eléctricos\nAire acondicionado\nRadio CD-Player\nClean CARFAX', NULL),
(16, 'Jeep', 'Cherokee Latitude', 2017, '625000.00', 'DOP', 'Jeepeta', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Audi+Q5', 'Usado', 'Blanco', 'Crema', '92,000 millas', '2.4L, 4 cilindros', '2WD', 'Alma Rosa II, Santo Domingo Este', NULL, 'Aire acondicionado\nAirbags\nAirbags laterales\nFrenos ABS\nCruise control\nCámara de reversa\nBluetooth\nApple CarPlay\nAndroid Auto\nAsientos de piel\nAsientos eléctricos\nVentanas automáticas\nSeguros eléctricos\nRetrovisores eléctricos\nGuía multifunción\nLlave inteligente\nPush Button\nFull Power\nAros de fábrica\nÚnico dueño\nPintura de fábrica', 'Motor 2.4L MultiAir de 4 cilindros\nTransmisión automática\nTracción 2WD\nAsientos en piel y eléctricos\nSistema multimedia Android\nApple CarPlay y Android Auto\nCámara de reversa\nAsistente de conducción\n8 bolsas de aire\nGomas 10/10\nLlave inteligente con Push Button\nGuía multifunción\nAros originales de fábrica\nClean CARFAX', NULL),
(17, 'Dodge', 'Avenger', 2014, '310000.00', 'DOP', 'Carro', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Lexus+RX350', 'Usado', 'Blanco', 'Gris', '1 km', '4', '2WD', 'Duquesa, Santo Domingo Norte', NULL, 'Aire acondicionado\nAirbags\nAirbag de pasajero\nAirbags laterales\nFrenos ABS\nCruise control\nRadio\nBluetooth\nVentanas automáticas\nSeguros eléctricos\nRetrovisores eléctricos\nGuía multifunción\nFull Power', 'Motor de 4 cilindros\nTransmisión automática\nTracción 2WD\nInterior gris\nExterior blanco', 'Precio negociable. Financiamiento disponible.'),
(18, 'Chevrolet', 'Corvette 3LT Convertible', 2023, '115900.00', 'USD', 'Carro', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Mazda+CX5', 'Usado', 'Blanco', 'Rojo', '11,000', '8', '2WD', NULL, NULL, 'Aire acondicionado\nAirbags\nAirbag de pasajero\nAirbags laterales\nAirbags traseros\nFrenos ABS\nCruise control\nNavegación\nCámara de reversa\nSensor de parqueo\nAndroid Auto\nAsientos de cuero\nAsientos eléctricos\nVentanas automáticas\nSeguros eléctricos\nRetrovisores eléctricos\nGuía multifunción\nLlave inteligente\nFull Power\nFaros LED\nÚnico dueño\nPintura de fábrica\nAros de fábrica', 'Motor de 8 cilindros\nConfiguración 3LT\nCarrocería convertible\nTransmisión automática\nTracción 2WD\nInterior en cuero rojo\nCámara de reversa\nSensores de parqueo\nSistema de navegación\nAndroid Auto\nAsientos eléctricos\nFaros LED\nLlave inteligente', NULL),
(19, 'Hyundai', 'Grand Starex', 2021, '1479000.00', 'DOP', 'Minivan', 'Automática', 'Diésel', 'https://via.placeholder.com/400x250?text=Subaru+Outback', 'Usado', NULL, NULL, NULL, NULL, NULL, 'Kilómetro 6 1/2 (Antiguo Kilómetro 7), Santiago de los Caballeros', NULL, 'Aire acondicionado delantero\nAire acondicionado trasero\nAmplio espacio para pasajeros\nAmplio espacio para equipaje\nInterior cómodo\nInterior bien conservado\nExcelente rendimiento de combustible', 'Motor Diésel CRDi\nTransmisión automática\nImportada desde Corea del Sur\nConfiguración Grand Starex\nEspaciosa para pasajeros y equipaje\nAire acondicionado delantero y trasero', 'Precio negociable.'),
(20, 'Nissan', 'Altima S', 2017, '569000.00', 'DOP', 'Carro', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=VW+Tiguan', 'Usado', 'Blanco', 'Negro', '1 km', '4', '2WD', 'Alameda, Santo Domingo Oeste', 'July Motors SRL', 'Aire acondicionado\nAlarma\nAirbags\nAirbag de pasajero\nAirbags laterales\nAirbags traseros\nFrenos ABS\nSeguros eléctricos\nAsientos eléctricos\nAsientos en piel\nAsientos en tela\nBluetooth\nCD Player\nGuía hidráulico\nGuía multifunción\nLimpia vidrios traseros\nLlave inteligente\nRadio AM/FM\nRetrovisores eléctricos\nVidrios eléctricos\nAros de magnesio\nPintura de fábrica\nAros de fábrica', 'Motor de 4 cilindros\nTransmisión automática\nTracción delantera\nVersión americana\nAros de magnesio\nAsientos eléctricos y en piel\nLlave inteligente\nGuía multifunción\nBluetooth\nFrenos ABS\nAirbags delanteros, laterales y traseros\nAire acondicionado\nAlarma', 'Financiamiento disponible. Cuota anunciada desde RD$ 16,448/mes.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculos_backup_20260827`
--

CREATE TABLE `vehiculos_backup_20260827` (
  `id` int(11) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(50) NOT NULL,
  `año` int(11) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `moneda` varchar(10) DEFAULT 'USD',
  `tipo` varchar(30) NOT NULL,
  `transmision` varchar(30) NOT NULL,
  `combustible` varchar(30) NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `condicion` varchar(50) DEFAULT NULL,
  `color_exterior` varchar(50) DEFAULT NULL,
  `color_interior` varchar(50) DEFAULT NULL,
  `kilometraje` varchar(50) DEFAULT NULL,
  `cilindraje` varchar(50) DEFAULT NULL,
  `traccion` varchar(20) DEFAULT NULL,
  `sector` varchar(150) DEFAULT NULL,
  `vendedor` varchar(150) DEFAULT NULL,
  `accesorios` text DEFAULT NULL,
  `equipamiento` text DEFAULT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `vehiculos_backup_20260827`
--

INSERT INTO `vehiculos_backup_20260827` (`id`, `marca`, `modelo`, `año`, `precio`, `moneda`, `tipo`, `transmision`, `combustible`, `imagen`, `condicion`, `color_exterior`, `color_interior`, `kilometraje`, `cilindraje`, `traccion`, `sector`, `vendedor`, `accesorios`, `equipamiento`, `descripcion`) VALUES
(1, 'Toyota', 'Corolla', 2020, '18500.00', 'USD', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Toyota+Corolla', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'Toyota', 'RAV4', 2022, '28000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Toyota+RAV4', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Honda', 'Civic', 2021, '1250000.00', 'DOP', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Honda+Civic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Honda', 'CR-V', 2019, '1400000.00', 'DOP', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Honda+CR-V', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'Hyundai', 'Tucson', 2021, '22000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Hyundai+Tucson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'Hyundai', 'Elantra', 2020, '980000.00', 'DOP', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Hyundai+Elantra', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'Kia', 'Sportage', 2022, '25000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Kia+Sportage', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Kia', 'Picanto', 2018, '550000.00', 'DOP', 'Hatchback', 'Mecánica', 'Gasolina', 'https://via.placeholder.com/400x250?text=Kia+Picanto', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'Nissan', 'Frontier', 2021, '31000.00', 'USD', 'Camioneta', 'Automática', 'Diesel', 'https://via.placeholder.com/400x250?text=Nissan+Frontier', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'Nissan', 'Sentra', 2019, '850000.00', 'DOP', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Nissan+Sentra', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'Ford', 'Explorer', 2020, '34000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Ford+Explorer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'Chevrolet', 'Tahoe', 2021, '52000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Chevrolet+Tahoe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'Jeep', 'Wrangler', 2019, '2150000.00', 'DOP', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Jeep+Wrangler', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'BMW', 'X5', 2021, '58000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=BMW+X5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 'Mercedes-Benz', 'C-Class', 2020, '2300000.00', 'DOP', 'Sedan', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Mercedes+C-Class', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 'Audi', 'Q5', 2021, '42000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Audi+Q5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'Lexus', 'RX 350', 2020, '2600000.00', 'DOP', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Lexus+RX350', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'Mazda', 'CX-5', 2021, '26000.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Mazda+CX5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'Subaru', 'Outback', 2020, '1600000.00', 'DOP', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=Subaru+Outback', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 'Volkswagen', 'Tiguan', 2021, '24500.00', 'USD', 'SUV', 'Automática', 'Gasolina', 'https://via.placeholder.com/400x250?text=VW+Tiguan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `vehiculos_backup_20260827`
--
ALTER TABLE `vehiculos_backup_20260827`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `vehiculos_backup_20260827`
--
ALTER TABLE `vehiculos_backup_20260827`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
