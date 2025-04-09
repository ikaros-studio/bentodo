class TodoManager {
    constructor() {
        this.todos = [];
        this.gridContainer = document.getElementById('gridContainer');
        this.taskInput = document.getElementById('taskInput');
        this.priorityInput = document.getElementById('priorityInput');
        this.notesInput = document.getElementById('notesInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.floatingAddBtn = document.getElementById('floatingAddBtn');
        this.darkModeBtn = document.getElementById('darkModeBtn');
        this.submitTaskBtn = document.getElementById('submitTaskBtn');
        console.log('Constructor - submitTaskBtn element:', this.submitTaskBtn);
        this.modal = document.getElementById('addTaskModal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        this.selectedColor = '#FFE4E1'; // Default color
        this.editTaskModal = document.getElementById('editTaskModal');
        this.editTaskInput = document.getElementById('editTaskInput');
        this.editPriorityInput = document.getElementById('editPriorityInput');
        this.editNotesInput = document.getElementById('editNotesInput');
        this.saveTaskBtn = document.getElementById('saveTaskBtn');
        this.markDoneBtn = document.getElementById('markDoneBtn');
        
        this.loadTodos();
        this.setupEventListeners();
        
        // Initial grid setup
        this.updateGrid();
        
        // Recalculate grid on resize
        window.addEventListener('resize', () => this.updateGrid());

        // Setup floating add button behavior
        this.setupFloatingAddButton();

        // Initialize dark mode
        this.initializeDarkMode();
    }

    initializeDarkMode() {
        // Check localStorage for dark mode preference
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            this.darkModeBtn.querySelector('img').src = 'assets/icons/sun.svg';
        }

        // Add click event for dark mode toggle
        this.darkModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isDark = !document.body.classList.contains('dark-mode');
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            // Update all todo items
            document.querySelectorAll('.todo-item').forEach(item => {
                if (isDark) {
                    item.style.backgroundColor = '#1e1e1e';
                    item.style.color = '#ffffff';
                } else {
                    item.style.backgroundColor = '';
                    item.style.color = '';
                }
            });

            // Update the icon
            this.darkModeBtn.querySelector('img').src = isDark ? 'assets/icons/sun.svg' : 'assets/icons/moon.svg';
            
            // Force a re-render of the grid
            this.updateGrid();
        });
    }

    setupFloatingAddButton() {
        let lastMouseX = 0;
        let lastMouseY = 0;
        let mouseMovingRight = false;
        let hideTimeout = null;
        const triggerZone = window.innerWidth * 0.75;
        const sidebar = document.querySelector('.floating-sidebar');

        document.addEventListener('mousemove', (e) => {
            const currentX = e.clientX;
            const currentY = e.clientY;
            
            mouseMovingRight = currentX > lastMouseX;
            
            if (currentX >= triggerZone) {
                sidebar.classList.add('visible');
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            } else {
                if (!hideTimeout) {
                    hideTimeout = setTimeout(() => {
                        sidebar.classList.remove('visible');
                    }, 500);
                }
            }
            
            lastMouseX = currentX;
            lastMouseY = currentY;
        });

        document.addEventListener('mouseleave', () => {
            sidebar.classList.remove('visible');
        });

        window.addEventListener('resize', () => {
            triggerZone = window.innerWidth * 0.75;
        });
    }

    setupEventListeners() {
        // Open modal via main add button
        this.addTaskBtn.addEventListener('click', () => this.openModal());
        
        // Open modal via floating add button
        if (this.floatingAddBtn) {
            this.floatingAddBtn.addEventListener('click', () => this.openModal());
        }
        
        // Close modals
        this.closeModalBtns.forEach(button => {
            button.addEventListener('click', () => {
                this.closeModal();
                this.closeEditModal();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
            if (e.target === this.editTaskModal) this.closeEditModal();
        });
        
        // Color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.style.backgroundColor = option.dataset.color;
            option.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedColor = option.dataset.color;
            });
        });
        
        // Submit task
        console.log('Setup - Attaching listener to:', this.submitTaskBtn);
        this.submitTaskBtn.addEventListener('click', () => this.addTodo());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        this.saveTaskBtn.addEventListener('click', () => this.saveEditedTodo());

        // Auto-save on input changes
        this.editTaskInput.addEventListener('input', () => this.saveEditedTodo(false));
        this.editPriorityInput.addEventListener('input', () => this.saveEditedTodo(false));
        this.editNotesInput.addEventListener('input', () => this.saveEditedTodo(false));
        
        // Auto-save on color selection
        document.querySelectorAll('#editTaskModal .color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('#editTaskModal .color-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.saveEditedTodo(false);
            });
        });

        // Mark as done button
        this.markDoneBtn.addEventListener('click', () => {
            if (this.currentEditingTodo) {
                this.deleteTodo(this.currentEditingTodo.id);
                this.closeEditModal();
            }
        });
    }

    openModal() {
        this.modal.style.display = 'block';
        this.taskInput.focus();
        // Select first color by default
        const firstColor = document.querySelector('.color-option');
        if (firstColor) {
            firstColor.classList.add('selected');
            this.selectedColor = firstColor.dataset.color;
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.taskInput.value = '';
        this.priorityInput.value = '5';
        this.notesInput.value = '';
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    }

    addTodo() {
        console.log("addTodo function called!");
        const title = this.taskInput.value.trim();
        const priority = parseInt(this.priorityInput.value);
        const notes = this.notesInput.value.trim();
        
        if (!title) return;
        
        const todo = {
            id: Date.now(),
            title,
            priority: Math.min(10, Math.max(1, priority)),
            color: this.selectedColor,
            notes,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        this.saveTodos();
        this.updateGrid();
        this.closeModal();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.updateGrid();
    }

    updateNotes(id, notes) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.notes = notes;
            this.saveTodos();
        }
    }

    updateGrid() {
        console.log('Starting updateGrid, clearing container');
        this.gridContainer.innerHTML = '';

        // Sort todos by priority (descending)
        const sortedTodos = [...this.todos].sort((a, b) => b.priority - a.priority);
        
        if (sortedTodos.length === 0) {
            // If no todos, add a placeholder with message
            const placeholder = document.createElement('div');
            placeholder.className = 'todo-item placeholder';
            placeholder.textContent = 'Add your first todo!';
            this.gridContainer.appendChild(placeholder);
            this.gridContainer.style.display = 'flex';
            return;
        }

        // Implement a treemap layout where size is proportional to priority
        this.createTreemap(sortedTodos);
    }
    
    createTreemap(todos) {
        // Configure the treemap container
        this.gridContainer.style.display = 'block';
        this.gridContainer.style.position = 'relative';
        
        // Calculate total priority value to determine proportions
        const totalPriority = todos.reduce((total, todo) => total + (todo.priority || 1), 0);
        const containerWidth = this.gridContainer.clientWidth;
        const containerHeight = this.gridContainer.clientHeight;
        const totalArea = containerWidth * containerHeight;
        
        console.log(`Treemap: ${todos.length} items, total priority: ${totalPriority}, area: ${totalArea}px²`);
        
        // Create the treemap layout
        const treemap = this.calculateTreemapLayout(todos, totalPriority, containerWidth, containerHeight);
        
        // Create and position todo elements
        todos.forEach((todo, index) => {
            const rect = treemap[index];
            const todoElement = this.createTreemapTodoElement(todo, rect);
            this.gridContainer.appendChild(todoElement);
        });
    }
    
    calculateTreemapLayout(items, totalValue, width, height) {
        // Implementation of the "squarified" treemap algorithm
        // This algorithm tries to create rectangles with aspect ratios close to 1 (squares)
        
        // Clone the items to avoid modifying the original
        const nodes = items.map(item => ({
            priority: item.priority || 1,
            width: 0,
            height: 0,
            x: 0,
            y: 0
        }));
        
        // Calculate the area for each item based on its priority
        nodes.forEach(node => {
            node.area = (node.priority / totalValue) * (width * height);
        });
        
        // Sort nodes by area (descending)
        nodes.sort((a, b) => b.area - a.area);
        
        // Use a basic treemap layout algorithm
        // Start with entire container
        const layout = this.squarify(nodes, {x: 0, y: 0, width, height});
        
        return layout;
    }
    
    squarify(nodes, container) {
        const { x, y, width, height } = container;
        const layout = [];
        let currentX = x;
        let currentY = y;
        let remainingWidth = width;
        let remainingHeight = height;
        
        // Process nodes in order
        nodes.forEach((node, index) => {
            let nodeWidth, nodeHeight, nodeX, nodeY;
            
            // Calculate the proportional width and height
            const area = node.area;
            
            if (remainingWidth >= remainingHeight) {
                // Layout horizontally if space is wider
                nodeHeight = remainingHeight;
                nodeWidth = area / nodeHeight;
                nodeX = currentX;
                nodeY = currentY;
                
                currentX += nodeWidth;
                remainingWidth -= nodeWidth;
            } else {
                // Layout vertically if space is taller
                nodeWidth = remainingWidth;
                nodeHeight = area / nodeWidth;
                nodeX = currentX;
                nodeY = currentY;
                
                currentY += nodeHeight;
                remainingHeight -= nodeHeight;
            }
            
            // Add to layout
            layout.push({
                x: nodeX,
                y: nodeY,
                width: nodeWidth,
                height: nodeHeight
            });
        });
        
        return layout;
    }
    
    createTreemapTodoElement(todo, rect) {
        const div = document.createElement('div');
        div.className = 'todo-item';
        div.style.backgroundColor = todo.color;
        div.setAttribute('data-id', todo.id);
        
        // Add random rounded edge
        const edges = ['top', 'right', 'bottom', 'left'];
        const randomEdge = edges[Math.floor(Math.random() * edges.length)];
        div.setAttribute('data-rounded', randomEdge);
        
        // Position absolutely based on treemap calculation
        div.style.position = 'absolute';
        div.style.left = `${rect.x}px`;
        div.style.top = `${rect.y}px`;
        div.style.width = `${rect.width}px`;
        div.style.height = `${rect.height}px`;
        
        // Add size class based on dimensions
        const area = rect.width * rect.height;
        if (area > 100000) { // Large items
            div.classList.add('large');
        } else if (area > 50000) { // Medium items
            div.classList.add('medium');
        } else if (area > 20000) { // Small items
            div.classList.add('small');
        } else { // Tiny items
            div.classList.add('tiny');
        }

        // Add subtle layered shadows for a gentle glow effect
        const rgb = this.hexToRgb(todo.color);
        if (rgb) {
            const shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
            const spreadColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
            div.style.boxShadow = `
                0 0 10px ${spreadColor},
                0 0 20px ${shadowColor}
            `;
        }
        
        const title = document.createElement('h3');
        title.textContent = todo.title;
        title.className = 'todo-title';
        
        // Make the entire card clickable for editing
        div.addEventListener('click', () => {
            this.openEditModal(todo);
        });
        
        div.appendChild(title);
        
        return div;
    }

    // Helper method to convert hex color to RGB
    hexToRgb(hex) {
        // Remove the hash if it exists
        hex = hex.replace('#', '');
        
        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return { r, g, b };
    }

    openEditModal(todo) {
        this.currentEditingTodo = todo;
        
        this.editTaskInput.value = todo.title;
        this.editPriorityInput.value = todo.priority;
        this.editNotesInput.value = todo.notes;

        // Set color
        document.querySelectorAll('#editTaskModal .color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === todo.color) {
                option.classList.add('selected');
            }
        });

        this.editTaskModal.style.display = 'block';
    }

    closeEditModal() {
        // Save changes before closing
        this.saveEditedTodo(false);
        
        this.editTaskModal.style.display = 'none';
        this.editTaskInput.value = '';
        this.editPriorityInput.value = '5';
        this.editNotesInput.value = '';
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    }

    saveEditedTodo(shouldClose = false) {
        if (!this.currentEditingTodo) return;

        const title = this.editTaskInput.value.trim();
        if (!title) return;

        const priority = parseInt(this.editPriorityInput.value) || 5;
        const notes = this.editNotesInput.value.trim();
        const selectedColor = document.querySelector('#editTaskModal .color-option.selected')?.dataset.color;
        
        // Find the todo in the array using the ID from the todo object
        const todoIndex = this.todos.findIndex(todo => todo.id === this.currentEditingTodo.id);
        
        if (todoIndex !== -1) {
            // Update the todo in the array
            this.todos[todoIndex] = {
                ...this.todos[todoIndex],
                title,
                priority,
                notes,
                color: selectedColor || this.todos[todoIndex].color
            };
            
            // Save to localStorage
            this.saveTodos();
        }

        if (shouldClose) {
            this.closeEditModal();
        }
        this.updateGrid();
    }

    saveTodos() {
        localStorage.setItem('gridio-todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const savedTodos = localStorage.getItem('gridio-todos');
        if (savedTodos) {
            this.todos = JSON.parse(savedTodos);
        }
    }
}

// Initialize the application after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    window.todoManager = new TodoManager(); // Instantiate the class
}); 