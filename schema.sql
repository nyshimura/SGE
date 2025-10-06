-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 06/10/2025
-- Versão do servidor: 11.8.3-MariaDB-log

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `mudeparaonomedoseubanco`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `courseId` int(11) NOT NULL,
  `studentId` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('Presente','Falta') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `teacherId` int(11) NOT NULL,
  `totalSlots` int(11) DEFAULT NULL COMMENT 'NULL para vagas ilimitadas',
  `status` enum('Aberto','Encerrado') NOT NULL DEFAULT 'Aberto',
  `dayOfWeek` varchar(50) DEFAULT NULL,
  `startTime` time DEFAULT NULL,
  `endTime` time DEFAULT NULL,
  `monthlyFee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paymentType` enum('recorrente','parcelado') NOT NULL DEFAULT 'recorrente',
  `installments` int(3) DEFAULT NULL,
  `closed_by_admin_id` int(11) DEFAULT NULL,
  `closed_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `enrollments`
--

CREATE TABLE `enrollments` (
  `studentId` int(11) NOT NULL,
  `courseId` int(11) NOT NULL,
  `status` enum('Pendente','Aprovada','Cancelada') NOT NULL DEFAULT 'Pendente',
  `billingStartDate` date DEFAULT NULL COMMENT 'Data de início para geração de cobranças',
  `enrollmentDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `studentId` int(11) NOT NULL,
  `courseId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `referenceDate` date NOT NULL COMMENT 'Primeiro dia do mês de referência (ex: 2023-10-01)',
  `dueDate` date NOT NULL,
  `status` enum('Pago','Pendente','Atrasado','Cancelado') NOT NULL DEFAULT 'Pendente',
  `paymentDate` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `school_profile`
--

CREATE TABLE `school_profile` (
  `id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(255) NOT NULL,
  `cnpj` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) NOT NULL,
  `pixKeyType` enum('CPF','CNPJ','E-mail','Telefone','Aleatória') NOT NULL,
  `pixKey` varchar(255) NOT NULL,
  `profilePicture` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `school_profile`
--

INSERT INTO `school_profile` (`id`, `name`, `cnpj`, `address`, `phone`, `pixKeyType`, `pixKey`, `profilePicture`) VALUES
(1, 'Nome da Escola Fictícia', '00.000.000/0001-00', 'Rua Exemplo, 123, Bairro Modelo', '(00) 00000-0000', 'CNPJ', '00000000000100', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `smtpServer` varchar(255) DEFAULT NULL,
  `smtpPort` varchar(10) DEFAULT NULL,
  `smtpUser` varchar(255) DEFAULT NULL,
  `smtpPass` varchar(255) DEFAULT NULL,
  `language` varchar(10) NOT NULL DEFAULT 'pt-BR',
  `timeZone` varchar(100) NOT NULL DEFAULT 'America/Sao_Paulo',
  `currencySymbol` varchar(5) NOT NULL DEFAULT 'R$',
  `enableTerminationFine` tinyint(1) NOT NULL DEFAULT 0,
  `terminationFineMonths` int(11) NOT NULL DEFAULT 1,
  `defaultDueDay` int(2) NOT NULL DEFAULT 10,
  `geminiApiKey` varchar(255) DEFAULT NULL,
  `dbHost` varchar(255) DEFAULT NULL,
  `dbUser` varchar(255) DEFAULT NULL,
  `dbPass` varchar(255) DEFAULT NULL,
  `dbName` varchar(255) DEFAULT NULL,
  `dbPort` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `system_settings`
--

INSERT INTO `system_settings` (`id`, `smtpServer`, `smtpPort`, `smtpUser`, `smtpPass`, `language`, `timeZone`, `currencySymbol`, `enableTerminationFine`, `terminationFineMonths`, `defaultDueDay`, `geminiApiKey`, `dbHost`, `dbUser`, `dbPass`, `dbName`, `dbPort`) VALUES
(1, NULL, NULL, NULL, NULL, 'pt-BR', 'America/Sao_Paulo', 'R$', 1, 1, 10, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'unassigned',
  `age` int(3) DEFAULT NULL,
  `profilePicture` longtext DEFAULT NULL COMMENT 'Armazena a imagem em base64',
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `email`, `password_hash`, `role`, `age`, `profilePicture`, `address`, `created_at`) VALUES
(1, 'Super', 'Admin', 'admin@admin', '$2y$10$/J6yz5uYX5iITNf4PvjKruiKJuLPSdxyIhGKGbnXDa6qmhxk5WGea', 'superadmin', NULL, NULL, NULL, '2025-10-02 23:26:14');

--
-- Índices para tabelas despejadas
--

ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_attendance` (`courseId`,`studentId`,`date`),
  ADD KEY `studentId` (`studentId`);

ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `teacherId` (`teacherId`),
  ADD KEY `closed_by_admin_id` (`closed_by_admin_id`);

ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`studentId`,`courseId`),
  ADD KEY `courseId` (`courseId`);

ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `school_profile`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restrições para tabelas despejadas
--

ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`teacherId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`closed_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
