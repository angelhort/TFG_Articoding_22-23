-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 25-05-2023 a las 17:51:12
-- Versión del servidor: 10.4.25-MariaDB
-- Versión de PHP: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `articoding`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `experimento`
--

CREATE TABLE `experimento` (
  `id` int(11) NOT NULL,
  `idProfesor` int(10) NOT NULL,
  `nombre` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `experimento`
--

INSERT INTO `experimento` (`id`, `idProfesor`, `nombre`) VALUES
(2, 5, 'Empresa 2022'),
(3, 5, 'Empresa 2023');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `nombre` varchar(25) NOT NULL,
  `contrasenya` varchar(100) NOT NULL,
  `rol` enum('admin','profesor','alumno') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id`, `nombre`, `contrasenya`, `rol`) VALUES
(1, 'admin', '$2b$10$CYXJIYF1QabyPuxKlCAYWOduRhLjiV8CJMtQrZken7KIsfn787V02', 'admin'),
(5, 'prof4Empresa', '$2b$10$HSVVADhpOPGfOLZsQw2tC.Cm3W9nP/uZu1FJnz.l5GC6zmpC/n93C', 'profesor');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `experimento`
--
ALTER TABLE `experimento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idProfesor` (`idProfesor`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `experimento`
--
ALTER TABLE `experimento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `experimento`
--
ALTER TABLE `experimento`
  ADD CONSTRAINT `experimento_ibfk_1` FOREIGN KEY (`idProfesor`) REFERENCES `usuario` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
