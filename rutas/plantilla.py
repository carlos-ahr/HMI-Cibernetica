from flask import Blueprint, render_template

plantilla = Blueprint('plantilla', __name__)

@plantilla.route('/proyecto/<nombre>/visual')
def mostrar_visual(nombre):
    return render_template('/Plantillas/visual.html', nombre=nombre)

@plantilla.route("/proyecto/<nombre>/menu")
def menu_proyecto(nombre):
    return render_template("/Plantillas/menu.html", nombre=nombre)

@plantilla.route("/proyecto/<nombre>/alarmas")
def alarmas(nombre):
    return render_template("/Plantillas/alarmas.html", nombre=nombre)

@plantilla.route("/proyecto/<nombre>/editar")
def editor(nombre):
    return render_template("editor_nuevo.html", nombre=nombre)


#PAGINAS WEB POSTGRESQL-----------------------------
@plantilla.route("/proyecto/<nombre>/historialPG")
def historial_pg(nombre):
    return render_template("/Plantillas/historial_pg.html", nombre=nombre)