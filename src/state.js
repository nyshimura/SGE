/**
 * Estado global da aplicação.
 */
export const appState = {
    currentUser: null,
    // <<<< ADICIONADO COMENTÁRIO: 'myCertificates' é um valor possível >>>>
    currentView: 'login', // Ex: 'login', 'dashboard', 'profile', 'myCertificates', etc.

    // Dados buscados da API
    users: [],
    courses: [],
    enrollments: [],
    attendance: [],
    payments: [],
    schoolProfile: null,
    systemSettings: null,

    // Estado da UI
    adminView: 'dashboard',
    viewingCourseId: null,
    viewingUserId: null,

    // Estado específico de cada view
    userFilters: {
        name: '',
        role: 'all',
        courseId: 'all',
        enrollmentStatus: 'all',
    },
    attendanceState: {
        courseId: null,
        selectedDate: new Date().toISOString().split('T')[0],
        students: [],
        history: {},
    },
    financialState: {
        isDashboardVisible: false,
        isControlPanelVisible: false,
        isDefaultersReportVisible: false,
        selectedDate: new Date().toISOString().slice(0, 7),
        defaultersReportMonth: new Date().toISOString().slice(0, 7),
        defaultersReportCourseId: 'all',
        expandedStudentId: null,
    },
    pixModal: {
        isOpen: false,
        paymentIds: [],
        content: null,
        // <<< Adicione isReenrollment aqui se necessário para o modal PIX >>>
        // isReenrollment: false,
    },
    documentTemplatesState: {
        isVisible: false,
        // <<< Considere adicionar outros estados relacionados a templates aqui se precisar >>>
        // isEditing: false,
        // contractTemplate: '',
        // imageTermsTemplate: '',
        // certificateTemplate: '',
        // certificateBackground: null,
        // signatureImage: null,
        // siteUrl: '',
    },
    // --- NOVO ESTADO --- <<< Este já estava no seu código original >>>
    enrollmentModalState: {
        isOpen: false,
        data: null, // Guardará os dados recebidos da API getEnrollmentDocuments
        isReenrollment: false // Indica se é um fluxo de rematrícula
    }
    // <<< Considere adicionar outros estados globais aqui, como isLoading, errorMessage, etc. >>>
    // isLoading: false,
    // errorMessage: null,
    // successMessage: null,
    // cardOrder: []
};