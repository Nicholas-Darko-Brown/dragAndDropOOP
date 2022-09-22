// Code goes here!

// Drag and Drop Interfaces
interface Drag {
    dragStartHandler(event: DragEvent): void
    dragEndHandler(event: DragEvent): void
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void
    dropHandler(event: DragEvent): void
    dragLeaveHandler(event: DragEvent): void
}

// Project Type
enum ProjectStatus {
  Active,
  InProgress,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

// AutoBind Decorator
const AutoBindDecorator = (
  _target: any,
  _2methodName: string | Symbol,
  descriptor: PropertyDescriptor
) => {
  const initialMedthod = descriptor.value;
  const alteredDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFunction = initialMedthod.bind(this);
      return boundFunction;
    },
  };
  return alteredDescriptor;
};

// Validation
interface ValidatorConfig {
  value: string | number;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

// User input validation conditions
const Validate = (validatableInput: ValidatorConfig) => {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
};

// Project State Management
type Listener<T> = (items: T[]) => void;

class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFunction: Listener<T>) {
      this.listeners.push(listenerFunction);
    }
}

class ProjectState extends State<Project> {
  private projects: Project[] = [];
  // Singleton class
  private static instance: ProjectState;

  private constructor() {
      super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }


  addProjects(title: string, description: string, people: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      people,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    this.updateListeners()
}

changeProjectStatus(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find(unorderedList => unorderedList.id === projectId)
    if(project && project.status !== newStatus) {
        project.status = newStatus
        this.updateListeners()
    }
}

private updateListeners() {
    for (const listenerFunction of this.listeners) {
      listenerFunction(this.projects.slice());
    }
  }
}

// Global state constant to be used for state management
const projectState = ProjectState.getInstance();

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertPosition: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertPosition);
  }

  private attach(insertPositionBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertPositionBeginning ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

// ProjectItem Class
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Drag {
    private project: Project

    get People(){
        if(this.project.people === 1){
            return 'only 1 person'
        } else {
            return `${this.project.people} people`
        }
    }

    constructor(hostId: string, project: Project) {
        super('single-project', hostId, false, project.id)
        this.project = project

        this.configure()
        this.renderContent()
    }

    @AutoBindDecorator
    dragStartHandler(event: DragEvent) {
      event.dataTransfer!.setData('text/plain', this.project.id)
      event.dataTransfer!.effectAllowed = 'move'
    }
  
    dragEndHandler(_event: DragEvent) {
        console.log('Drag end')
    }

    configure(){
        this.element.addEventListener('dragstart', this.dragStartHandler)
        this.element.addEventListener('dragend', this.dragEndHandler)
    }

    renderContent(){
        this.element.querySelector('h2')!.textContent = this.project.title
        this.element.querySelector('h3')!.textContent = this.People + ' assigned'
        this.element.querySelector('p')!.textContent = this.project.description
    }
}

// Projectlist Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
  assignedProjects: Project[];

  constructor(private type: "active" | "inProgress" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @AutoBindDecorator  // To make sure that "this" keyword is bound to the surrounding class
  dragOverHandler(event: DragEvent) {
      if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
        event.preventDefault()
        const listElements = this.element.querySelector('ul')!
      listElements.classList.add('droppable')
      }
      
  }

  @AutoBindDecorator
  dropHandler(event: DragEvent) {
      const projectId = event.dataTransfer!.getData('text/plain')
      projectState.changeProjectStatus(projectId, this.type === 'active' ? ProjectStatus.Active : this.type === 'inProgress' ? ProjectStatus.InProgress : ProjectStatus.Finished  )
  }

  @AutoBindDecorator
  dragLeaveHandler(_event: DragEvent) {
    const listElements = this.element.querySelector('ul')!
    listElements.classList.remove('droppable')
  }

  configure() {
    this.element.addEventListener('dragover', this.dragOverHandler)
    this.element.addEventListener('dragleave', this.dragLeaveHandler)
    this.element.addEventListener('drop', this.dropHandler)

    // Listens to state changes
    projectState.addListener((projects: Project[]) => {
      const filteredProjects = projects.filter((project) => {
        if (this.type === "active") {
          return project.status === ProjectStatus.Active;
        } else if (this.type === "inProgress") {
          return project.status === ProjectStatus.InProgress;
        } else {
          return project.status === ProjectStatus.Finished;
        }
      });
      this.assignedProjects = filteredProjects;
      this.renderProjects();
    });
  }

  renderContent() {
    // Get list id from type in constructor
    const listId = `${this.type}-projects-list`;
    // Extract id of ul and assign listId to it
    this.element.querySelector("ul")!.id = listId;
    // Add title content inside h2 tag
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }

  renderProjects() {
    const listElements = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    // Prevents duplicates
    listElements.innerHTML = "";
    for (const projectItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector('ul')!.id, projectItem)
    }
  }

}

// Project Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  // Input elements initialization
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");
    this.titleInputElement = this.element.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;
    this.configure();
  }

  // Bind submitHandler to event listener
  configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }

  renderContent() {}

  // Clear inputs
  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  // Add AutoBind function in order capture input value
  @AutoBindDecorator
  private submitHandler(event: Event) {
    event.preventDefault();
    // console.log(this.descriptionInputElement.value)
    const userInput = this.gatherUserInput();
    // Check if user input is an array
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;
      // Add inputs to project state to always return same object structure
      projectState.addProjects(title, description, people);
      this.clearInputs();
    }
  }

  // Collectuser input function that returns a tuple or void
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    // Add Validations to input fields
    const titleValidatable: ValidatorConfig = {
      value: enteredTitle,
      required: true,
    };

    const descriptionValidatable: ValidatorConfig = {
      value: enteredDescription,
      required: true,
      minLength: 8,
      maxLength: 99,
    };

    const peopleValidatable: ValidatorConfig = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5,
    };

    // Check for Validation for each field
    if (
      !Validate(titleValidatable) ||
      !Validate(descriptionValidatable) ||
      !Validate(peopleValidatable)
    ) {
      alert("Wrong input, try again");
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }
}

// Various instances of classes
const projInput = new ProjectInput();

const activeProjectInput = new ProjectList("active");
const inProgressProjectInput = new ProjectList("inProgress");
const finishedProjectInput = new ProjectList("finished");
