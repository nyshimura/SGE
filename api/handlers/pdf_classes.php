<?php
// api/handlers/pdf_classes.php

require_once __DIR__ . '/../fpdf/fpdf.php';

// --- CLASSE PDF_Contract ---
class PDF_Contract extends FPDF {
    private $sidebarText = '';
    function SetSidebarText($text){ $this->sidebarText = $text; }
    function AddPage($orientation = '', $size = '', $rotation = 0){ parent::AddPage($orientation, $size, $rotation); if (!empty($this->sidebarText)) { $this->AddSidebar(); } }
    function AddSidebar() { /* ... (Seu código da função AddSidebar) ... */ }
    var $angle = 0; function Rotate($angle, $x = -1, $y = -1) { /* ... (Seu código da função Rotate) ... */ }
    function _endpage() { if ($this->angle != 0) { $this->angle = 0; $this->_out('Q'); } parent::_endpage(); }
}

// --- CLASSE PDF_Certificate ---
class PDF_Certificate extends FPDF {
    private $backgroundImage = null;
    function SetBackgroundImage($imagePath){ if ($imagePath && file_exists($imagePath)) { $this->backgroundImage = $imagePath; } }
    function AddPage($orientation = '', $size = '', $rotation = 0){ parent::AddPage($orientation, $size, $rotation); if ($this->backgroundImage) { $this->Image($this->backgroundImage, 0, 0, 297, 210); } }
    function WriteHTML($html, $lineHeight = 7) { /* ... (Seu código da função WriteHTML) ... */ }
}

?>